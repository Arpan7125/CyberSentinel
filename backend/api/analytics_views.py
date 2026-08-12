"""Live analytics endpoints.

Every number returned here is computed from rows the platform actually holds.
These endpoints exist specifically to replace the hard-coded arrays the admin
and customer dashboards used to render (fabricated MRR, invented traffic
figures, a static bar chart). Where the data genuinely does not exist yet, the
response says so explicitly instead of substituting a plausible-looking value.
"""

from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.db.models import Avg, Count, Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    ContactLead, PaymentInvoice, ScamReport, ScanLog, Subscriber,
    SubscriptionPlan, SupportTicket, UserSubscription,
)
from .permissions import IsAdmin
from .predictions import (
    FORECAST_HORIZON_DAYS, daily_series, forecast_series, pct_change,
    risk_trajectory, threat_encounter_probability,
)

THREAT_LEVELS = ['Medium', 'High', 'Critical']


def _window(days):
    """(start_of_current_period, start_of_preceding_period_of_equal_length)."""
    now = timezone.now()
    current_start = now - timedelta(days=days)
    previous_start = now - timedelta(days=days * 2)
    return current_start, previous_start


def _metric(label, current, previous, unit=''):
    """A headline figure paired with its period-over-period movement."""
    return {
        'label': label,
        'value': current,
        'previous': previous,
        'change_pct': pct_change(current, previous),
        'unit': unit,
    }


class AdminAnalyticsView(APIView):
    """Platform-wide traffic, engagement, and conversion — all measured.

    Replaces the hard-coded `trafficMetrics` / `conversionStats` arrays that
    the admin analytics page used to render.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        days = min(int(request.query_params.get('days', 30)), 365)
        current_start, previous_start = _window(days)

        def counts(model, field='created_at'):
            current = model.objects.filter(**{f'{field}__gte': current_start}).count()
            previous = model.objects.filter(
                **{f'{field}__gte': previous_start, f'{field}__lt': current_start}
            ).count()
            return current, previous

        new_users, prev_users = counts(User, 'date_joined')
        new_scans, prev_scans = counts(ScanLog)
        new_leads, prev_leads = counts(ContactLead)
        new_subs, prev_subs = counts(Subscriber)

        threats_now = ScanLog.objects.filter(
            created_at__gte=current_start, risk_level__in=THREAT_LEVELS
        ).count()
        threats_prev = ScanLog.objects.filter(
            created_at__gte=previous_start, created_at__lt=current_start,
            risk_level__in=THREAT_LEVELS,
        ).count()

        total_users = User.objects.count()
        paying_users = UserSubscription.objects.filter(status='active').count()

        # An account counts as active if it ran at least one scan in the window.
        active_users = (
            ScanLog.objects.filter(created_at__gte=current_start, user__isnull=False)
            .values('user').distinct().count()
        )

        scan_series = daily_series(ScanLog.objects.all(), days=days)
        threat_series = daily_series(
            ScanLog.objects.filter(risk_level__in=THREAT_LEVELS), days=days
        )

        timeseries = [
            {
                'date': point['date'].strftime('%b %d'),
                'scans': point['count'],
                'threats': threat_point['count'],
            }
            for point, threat_point in zip(scan_series, threat_series)
        ]

        scan_type_rows = (
            ScanLog.objects.filter(created_at__gte=current_start)
            .values('scan_type').annotate(count=Count('id')).order_by('-count')
        )

        return Response({
            'period_days': days,
            'traffic_metrics': [
                _metric('New Accounts', new_users, prev_users),
                _metric('Scans Performed', new_scans, prev_scans),
                _metric('Threats Detected', threats_now, threats_prev),
                _metric('Newsletter Signups', new_subs, prev_subs),
            ],
            'conversion_metrics': [
                _metric('Inbound Leads', new_leads, prev_leads),
                {
                    'label': 'Signup → Paid Conversion',
                    'value': round((paying_users / total_users) * 100, 1) if total_users else 0.0,
                    'previous': None,
                    'change_pct': None,
                    'unit': '%',
                },
                {
                    'label': 'Active Accounts (scanned in period)',
                    'value': active_users,
                    'previous': None,
                    'change_pct': None,
                    'unit': '',
                },
                {
                    'label': 'Threat Hit Rate',
                    'value': round((threats_now / new_scans) * 100, 1) if new_scans else 0.0,
                    'previous': round((threats_prev / prev_scans) * 100, 1) if prev_scans else None,
                    'change_pct': None,
                    'unit': '%',
                },
            ],
            'timeseries': timeseries,
            'scan_type_distribution': {row['scan_type']: row['count'] for row in scan_type_rows},
            'forecast': {
                'scans': forecast_series(scan_series, label='scan volume'),
                'threats': forecast_series(threat_series, label='threat volume'),
            },
            'totals': {
                'users': total_users,
                'paying_users': paying_users,
                'scans': ScanLog.objects.count(),
                'open_tickets': SupportTicket.objects.exclude(status='Closed').count(),
            },
        })


class AdminRevenueView(APIView):
    """Revenue computed from actual subscriptions and invoices.

    Replaces the finance dashboard's fabricated MRR/ARR figures and its static
    seven-bar chart.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        months = min(int(request.query_params.get('months', 7)), 24)
        now = timezone.now()

        active_subs = (
            UserSubscription.objects.filter(status='active')
            .select_related('plan', 'user')
        )

        # Normalise every plan to a monthly figure before summing, otherwise an
        # annual plan would inflate MRR twelvefold.
        mrr = Decimal('0.00')
        for sub in active_subs:
            if not sub.plan:
                continue
            price = sub.plan.price or Decimal('0.00')
            mrr += price / 12 if sub.plan.interval == 'year' else price

        mrr = mrr.quantize(Decimal('0.01'))
        arr = (mrr * 12).quantize(Decimal('0.01'))

        period_start = now - timedelta(days=30)
        prior_start = now - timedelta(days=60)

        failed_now = PaymentInvoice.objects.filter(status='failed', date__gte=period_start).count()
        failed_prev = PaymentInvoice.objects.filter(
            status='failed', date__gte=prior_start, date__lt=period_start
        ).count()

        active_count = active_subs.count()
        past_due = UserSubscription.objects.filter(status='past_due').count()
        canceled = UserSubscription.objects.filter(status='canceled').count()

        # Collected revenue per calendar month, oldest bucket first. Real month
        # boundaries rather than 30-day approximations, so the labels line up
        # with what an accountant would reconcile against.
        revenue_series = []
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        boundaries = [month_start]
        for _ in range(months):
            # Stepping back one day from a month's first day lands in the prior
            # month, whatever its length.
            boundaries.append((boundaries[-1] - timedelta(days=1)).replace(day=1))

        for index in range(months, 0, -1):
            bucket_start = boundaries[index]
            bucket_end = boundaries[index - 1]
            collected = PaymentInvoice.objects.filter(
                status='paid', date__gte=bucket_start, date__lt=bucket_end
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            revenue_series.append({
                'label': bucket_start.strftime('%b %Y'),
                'amount': float(collected),
            })

        recent_payments = [
            {
                'email': invoice.user.email or invoice.user.username,
                'amount': float(invoice.amount),
                'status': invoice.get_status_display(),
                'date': invoice.date.strftime('%Y-%m-%d'),
            }
            for invoice in PaymentInvoice.objects.select_related('user').order_by('-date')[:8]
        ]

        plan_breakdown = [
            {
                'plan': plan.name,
                'price': float(plan.price),
                'interval': plan.interval,
                'subscribers': UserSubscription.objects.filter(plan=plan, status='active').count(),
            }
            for plan in SubscriptionPlan.objects.filter(is_active=True)
        ]

        lifetime_collected = PaymentInvoice.objects.filter(status='paid').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        churn_base = active_count + canceled
        churn_rate = round((canceled / churn_base) * 100, 1) if churn_base else 0.0

        return Response({
            'kpis': [
                {'label': 'Monthly Recurring Revenue', 'value': float(mrr), 'unit': 'currency'},
                {'label': 'Annual Recurring Revenue', 'value': float(arr), 'unit': 'currency'},
                {'label': 'Active Subscriptions', 'value': active_count, 'unit': ''},
                {
                    'label': 'Failed Payments (30d)',
                    'value': failed_now,
                    'previous': failed_prev,
                    'change_pct': pct_change(failed_now, failed_prev),
                    'unit': '',
                    'lower_is_better': True,
                },
            ],
            'revenue_series': revenue_series,
            'recent_payments': recent_payments,
            'plan_breakdown': plan_breakdown,
            'subscription_states': {
                'active': active_count,
                'past_due': past_due,
                'canceled': canceled,
            },
            'lifetime_collected': float(lifetime_collected),
            'churn_rate_pct': churn_rate,
            # The dashboard renders an explicit empty state off this flag rather
            # than drawing a chart of zeroes that looks like a business collapse.
            'has_billing_data': PaymentInvoice.objects.exists() or active_count > 0,
        })


class AdminThreatCenterView(APIView):
    """Threat severity distribution and the live investigation queue."""
    permission_classes = [IsAdmin]

    def get(self, request):
        days = min(int(request.query_params.get('days', 30)), 365)
        current_start, previous_start = _window(days)

        window = ScanLog.objects.filter(created_at__gte=current_start)
        prior = ScanLog.objects.filter(
            created_at__gte=previous_start, created_at__lt=current_start
        )

        severity = []
        for level in ['Critical', 'High', 'Medium', 'Low']:
            current = window.filter(risk_level=level).count()
            previous = prior.filter(risk_level=level).count()
            severity.append({
                'level': level,
                'count': current,
                'previous': previous,
                'change_pct': pct_change(current, previous),
            })

        unknown = window.filter(risk_level='Unknown').count()
        if unknown:
            severity.append({
                'level': 'Unknown',
                'count': unknown,
                'previous': prior.filter(risk_level='Unknown').count(),
                'change_pct': None,
            })

        critical_scans = [
            {
                'id': scan.id,
                'scan_type': scan.scan_type,
                'preview': scan.input_content[:120],
                'risk_score': scan.risk_score,
                'risk_level': scan.risk_level,
                'user': scan.user.username if scan.user else 'Anonymous',
                'created_at': scan.created_at.strftime('%Y-%m-%d %H:%M'),
            }
            for scan in window.filter(risk_level__in=['High', 'Critical'])
                              .select_related('user').order_by('-created_at')[:25]
        ]

        report_queue = [
            {
                'id': report.id,
                'target': report.url_or_email,
                'description': report.description[:200],
                'status': report.get_status_display(),
                'reported_by': report.reported_by.username if report.reported_by else 'Anonymous',
                'created_at': report.created_at.strftime('%Y-%m-%d %H:%M'),
            }
            for report in ScamReport.objects.select_related('reported_by')
                                    .order_by('-created_at')[:25]
        ]

        threat_series = daily_series(
            ScanLog.objects.filter(risk_level__in=THREAT_LEVELS), days=days
        )

        return Response({
            'period_days': days,
            'severity_distribution': severity,
            'total_scanned': window.count(),
            'average_risk_score': round(window.aggregate(avg=Avg('risk_score'))['avg'] or 0.0, 1),
            'critical_scans': critical_scans,
            'report_queue': report_queue,
            'report_status_counts': {
                row['status']: row['count']
                for row in ScamReport.objects.values('status').annotate(count=Count('id'))
            },
            'forecast': forecast_series(threat_series, label='threat volume'),
        })


class UserInsightsView(APIView):
    """Per-user security posture, recommendations, and predictions.

    Replaces the customer dashboard's static `aiRecommendations` list — every
    item below is triggered by something in this user's own scan history.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        days = min(int(request.query_params.get('days', 30)), 365)

        scans = ScanLog.objects.filter(user=user)
        window = scans.filter(created_at__gte=timezone.now() - timedelta(days=days))

        total = window.count()
        threats = window.filter(risk_level__in=THREAT_LEVELS).count()
        critical = window.filter(risk_level='Critical').count()

        scan_series = daily_series(scans, days=days)
        threat_series = daily_series(scans.filter(risk_level__in=THREAT_LEVELS), days=days)

        trajectory = risk_trajectory(
            list(window.values_list('created_at', 'risk_score'))
        )

        by_type = {
            row['scan_type']: row['count']
            for row in window.values('scan_type').annotate(count=Count('id'))
        }

        return Response({
            'period_days': days,
            'summary': {
                'scans': total,
                'threats': threats,
                'critical': critical,
                'threat_rate_pct': round((threats / total) * 100, 1) if total else 0.0,
                'average_risk': round(window.aggregate(avg=Avg('risk_score'))['avg'] or 0.0, 1),
            },
            'scan_type_distribution': by_type,
            'risk_trajectory': trajectory,
            'forecast': forecast_series(scan_series, label='your scan volume'),
            'threat_probability': threat_encounter_probability(threat_series),
            'recommendations': _build_recommendations(user, window, by_type, trajectory, critical),
        })


def _build_recommendations(user, window, by_type, trajectory, critical):
    """Recommendations earned by this user's actual behaviour.

    Each entry names the observation that triggered it, so the advice is
    auditable rather than a generic security platitude.
    """
    recommendations = []
    total = window.count()

    if total == 0:
        return [{
            'priority': 'info',
            'title': 'Run your first scan',
            'detail': (
                'You have no scans on record yet. Paste a suspicious message into the '
                'Text Scanner or check a link with the URL Scanner to start building '
                'your security profile.'
            ),
            'basis': 'No scan history',
            'action': '/dashboard/text-scan',
        }]

    if critical > 0:
        recommendations.append({
            'priority': 'critical',
            'title': f'{critical} critical threat{"s" if critical > 1 else ""} detected',
            'detail': (
                'Change the passwords for any account referenced in those messages and '
                'enable two-factor authentication. Do not reuse a password that appeared '
                'in a credential-harvesting attempt.'
            ),
            'basis': f'{critical} scans scored Critical in this period',
            'action': '/dashboard/reports',
        })

    if trajectory.get('available') and trajectory.get('direction') == 'worsening':
        recommendations.append({
            'priority': 'high',
            'title': 'Your threat exposure is rising',
            'detail': (
                'Recent scans are scoring higher than your earlier ones, which usually '
                'means your address has been added to an active target list. Treat '
                'unsolicited messages with extra suspicion over the next few weeks.'
            ),
            'basis': (
                f'Exposure score {trajectory["exposure_score"]}, '
                f'up {abs(trajectory["delta"])} points across the period'
            ),
            'action': '/dashboard/reports',
        })

    if not by_type.get('URL') and total >= 3:
        recommendations.append({
            'priority': 'medium',
            'title': 'Check links before you click them',
            'detail': (
                'You have scanned message text but never a URL. Most phishing damage '
                'happens on the destination page, not in the message itself.'
            ),
            'basis': 'No URL scans on record',
            'action': '/dashboard/url-scanner',
        })

    profile = getattr(user, 'profile', None)
    if profile is not None and not profile.mfa_enabled:
        recommendations.append({
            'priority': 'high',
            'title': 'Two-factor authentication is off',
            'detail': (
                'A stolen password alone would be enough to reach your CyberSentinel '
                'account. Turn on 2FA in account security.'
            ),
            'basis': 'MFA disabled on your profile',
            'action': '/dashboard/account-security',
        })

    from .models import ConnectedAccount
    if not ConnectedAccount.objects.filter(user=user, status='connected').exists():
        recommendations.append({
            'priority': 'low',
            'title': 'Connect an inbox for continuous scanning',
            'detail': (
                'Right now you only see threats you paste in manually. Connecting Gmail '
                'lets CyberSentinel scan incoming mail as it arrives.'
            ),
            'basis': 'No connected accounts',
            'action': '/dashboard/integrations',
        })

    if not recommendations:
        recommendations.append({
            'priority': 'info',
            'title': 'No action needed right now',
            'detail': (
                'Nothing in your recent scan history warrants a change. Keep scanning '
                'anything unexpected that asks for credentials or payment.'
            ),
            'basis': f'{total} scans reviewed, no critical findings',
            'action': None,
        })

    order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3, 'info': 4}
    recommendations.sort(key=lambda r: order.get(r['priority'], 9))
    return recommendations


class UsageMetricsView(APIView):
    """Plan usage measured against the signed-in user's real activity.

    Replaces the billing page's hard-coded `usageMetrics` array.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        period_start = now - timedelta(days=30)

        subscription = UserSubscription.objects.filter(user=user).select_related('plan').first()
        plan_name = subscription.plan.name if subscription and subscription.plan else 'Free'

        # Quotas are read from the plan's feature list when present, so changing
        # a plan in the admin changes what customers see without a code change.
        limits = _plan_limits(subscription)

        scans = ScanLog.objects.filter(user=user, created_at__gte=period_start)
        by_type = {
            row['scan_type']: row['count']
            for row in scans.values('scan_type').annotate(count=Count('id'))
        }

        def metric(label, used, limit):
            return {
                'label': label,
                'used': used,
                'limit': limit,
                'unlimited': limit is None,
                'pct': round(min(100.0, (used / limit) * 100), 1) if limit else None,
            }

        from .models import ConnectedAccount
        metrics = [
            metric('Total scans', scans.count(), limits['scans']),
            metric('File scans', by_type.get('FILE', 0), limits['file_scans']),
            metric('Screenshot scans', by_type.get('SCREENSHOT', 0), limits['screenshot_scans']),
            metric(
                'Connected accounts',
                ConnectedAccount.objects.filter(user=user, status='connected').count(),
                limits['connected_accounts'],
            ),
        ]

        return Response({
            'plan': plan_name,
            'status': subscription.status if subscription else 'none',
            'renews_at': (
                subscription.current_period_end.strftime('%Y-%m-%d')
                if subscription and subscription.current_period_end else None
            ),
            'cancel_at_period_end': subscription.cancel_at_period_end if subscription else False,
            'period_start': period_start.strftime('%Y-%m-%d'),
            'period_end': now.strftime('%Y-%m-%d'),
            'metrics': metrics,
            'invoices': [
                {
                    'id': invoice.id,
                    'amount': float(invoice.amount),
                    'status': invoice.get_status_display(),
                    'date': invoice.date.strftime('%Y-%m-%d'),
                    'pdf_url': invoice.pdf_url,
                }
                for invoice in PaymentInvoice.objects.filter(user=user).order_by('-date')[:12]
            ],
        })


#: Quotas applied when a plan does not declare its own. `None` means unlimited.
FREE_TIER_LIMITS = {
    'scans': 50,
    'file_scans': 10,
    'screenshot_scans': 10,
    'connected_accounts': 1,
}

PAID_TIER_LIMITS = {
    'scans': None,
    'file_scans': None,
    'screenshot_scans': None,
    'connected_accounts': 10,
}


def _plan_limits(subscription):
    """Resolve quotas for a subscription, preferring limits declared on the plan.

    A plan can carry entries like ``"limit:scans=500"`` in its `features` list;
    anything unspecified falls back to the tier default.
    """
    if subscription and subscription.status == 'active' and subscription.plan:
        limits = dict(PAID_TIER_LIMITS)
        for feature in (subscription.plan.features or []):
            if not isinstance(feature, str) or not feature.startswith('limit:'):
                continue
            try:
                key, raw = feature[len('limit:'):].split('=', 1)
                key = key.strip()
                if key in limits:
                    limits[key] = None if raw.strip().lower() in ('none', 'unlimited') else int(raw)
            except (ValueError, TypeError):
                continue  # A malformed entry falls back to the tier default.
        return limits
    return dict(FREE_TIER_LIMITS)


class ThreatForecastView(APIView):
    """Forward-looking threat projection for the signed-in user.

    Anonymous callers are not supported: a forecast built from other people's
    scans would be meaningless.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = min(int(request.query_params.get('days', 30)), 365)
        scans = ScanLog.objects.filter(user=request.user)

        scan_series = daily_series(scans, days=days)
        threat_series = daily_series(scans.filter(risk_level__in=THREAT_LEVELS), days=days)

        history = [
            {
                'date': point['date'].strftime('%b %d'),
                'scans': point['count'],
                'threats': threat_point['count'],
            }
            for point, threat_point in zip(scan_series, threat_series)
        ]

        return Response({
            'horizon_days': FORECAST_HORIZON_DAYS,
            'history': history,
            'scan_forecast': forecast_series(scan_series, label='your scan volume'),
            'threat_forecast': forecast_series(threat_series, label='your threat volume'),
            'encounter_probability': threat_encounter_probability(threat_series),
            'risk_trajectory': risk_trajectory(list(scans.values_list('created_at', 'risk_score')[:500])),
        })
