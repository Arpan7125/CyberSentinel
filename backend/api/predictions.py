"""Forecasting and risk-trajectory maths used by the live dashboards.

Everything here is derived from rows the platform actually recorded. When there
is not enough history to say anything defensible, these helpers return
``available: False`` with a reason rather than inventing a trend line — a
confident-looking forecast drawn from three data points is worse than no
forecast, because the user cannot tell the difference.
"""

import math
from datetime import timedelta

import numpy as np
from django.utils import timezone

#: Below this many days with recorded activity a regression is meaningless.
MIN_HISTORY_DAYS = 7

#: How far ahead the dashboards project.
FORECAST_HORIZON_DAYS = 7


def daily_series(queryset, days=30, date_field='created_at'):
    """Bucket a queryset into one count per day, oldest first.

    Days with no rows are represented as 0 rather than omitted — gaps would
    otherwise distort the regression's notion of elapsed time.
    """
    today = timezone.now().date()
    start = today - timedelta(days=days - 1)

    rows = queryset.filter(**{f'{date_field}__date__gte': start})

    counts = {}
    for value in rows.values_list(date_field, flat=True):
        day = timezone.localtime(value).date() if timezone.is_aware(value) else value.date()
        counts[day] = counts.get(day, 0) + 1

    series = []
    for offset in range(days):
        day = start + timedelta(days=offset)
        series.append({'date': day, 'count': counts.get(day, 0)})
    return series


def _linear_forecast(values, horizon):
    """Least-squares trend fit plus an 80% prediction interval.

    Returns (predictions, slope, interval_half_width). The interval comes from
    the residual standard error, so a noisy history produces visibly wider
    bands instead of a falsely precise line.
    """
    n = len(values)
    x = np.arange(n, dtype=float)
    y = np.asarray(values, dtype=float)

    slope, intercept = np.polyfit(x, y, 1)

    fitted = slope * x + intercept
    residuals = y - fitted

    # Two parameters were estimated (slope and intercept), hence n - 2.
    dof = max(1, n - 2)
    residual_se = float(np.sqrt(np.sum(residuals ** 2) / dof))

    # 1.28 ≈ the 90th percentile of the standard normal, giving a two-sided 80%
    # band. Deliberately not 95% — these are short, noisy operational series and
    # a 95% band on them is so wide it stops being actionable.
    half_width = 1.28 * residual_se

    future_x = np.arange(n, n + horizon, dtype=float)
    predictions = slope * future_x + intercept

    return predictions, float(slope), half_width


def forecast_series(series, horizon=FORECAST_HORIZON_DAYS, label='events'):
    """Project a daily-count series forward.

    `series` is the output of `daily_series`.
    """
    values = [point['count'] for point in series]
    active_days = sum(1 for v in values if v > 0)

    if active_days < MIN_HISTORY_DAYS:
        return {
            'available': False,
            'reason': (
                f'Not enough history to forecast {label}. '
                f'{active_days} of the last {len(values)} days have activity; '
                f'{MIN_HISTORY_DAYS} are needed.'
            ),
            'days_with_activity': active_days,
            'days_required': MIN_HISTORY_DAYS,
        }

    predictions, slope, half_width = _linear_forecast(values, horizon)

    last_date = series[-1]['date']
    points = []
    for offset, predicted in enumerate(predictions, start=1):
        # Counts cannot go negative, and the interval is clipped to match.
        centre = max(0.0, float(predicted))
        points.append({
            'date': (last_date + timedelta(days=offset)).strftime('%b %d'),
            'predicted': round(centre, 1),
            'lower': round(max(0.0, centre - half_width), 1),
            'upper': round(centre + half_width, 1),
        })

    recent_mean = float(np.mean(values[-7:]))
    projected_mean = float(np.mean([p['predicted'] for p in points]))

    if recent_mean > 0:
        change_pct = round(((projected_mean - recent_mean) / recent_mean) * 100, 1)
    else:
        change_pct = None

    # A slope smaller than this is noise, not a trend, on counts this small.
    trend_threshold = max(0.05, recent_mean * 0.02)
    if slope > trend_threshold:
        direction = 'rising'
    elif slope < -trend_threshold:
        direction = 'falling'
    else:
        direction = 'steady'

    return {
        'available': True,
        'horizon_days': horizon,
        'points': points,
        'trend': direction,
        'slope_per_day': round(slope, 3),
        'recent_daily_average': round(recent_mean, 2),
        'projected_daily_average': round(projected_mean, 2),
        'change_pct': change_pct,
        'confidence': '80% prediction interval from residual standard error',
        'basis_days': len(values),
    }


def threat_encounter_probability(threat_days_series, horizon=FORECAST_HORIZON_DAYS):
    """Probability of hitting at least one threat in the next `horizon` days.

    Models threat arrivals as a Poisson process with rate λ estimated from the
    observed history: P(at least one) = 1 - e^(-λ·horizon).
    """
    values = [point['count'] for point in threat_days_series]
    observed_days = len(values)
    total_threats = sum(values)

    if observed_days < MIN_HISTORY_DAYS:
        return {
            'available': False,
            'reason': f'Needs at least {MIN_HISTORY_DAYS} days of scan history.',
        }

    lam = total_threats / observed_days  # threats per day
    probability = 1.0 - math.exp(-lam * horizon)

    if probability >= 0.75:
        band = 'Very likely'
    elif probability >= 0.45:
        band = 'Likely'
    elif probability >= 0.15:
        band = 'Possible'
    else:
        band = 'Unlikely'

    return {
        'available': True,
        'horizon_days': horizon,
        'probability': round(probability * 100, 1),
        'band': band,
        'daily_rate': round(lam, 3),
        'observed_threats': total_threats,
        'observed_days': observed_days,
        'model': 'Poisson arrival process fitted to observed threat history',
    }


def risk_trajectory(scored_series, half_life_days=7):
    """Exponentially weighted mean risk score, so recent scans dominate.

    `scored_series` is a list of (datetime, risk_score) newest-first or oldest-
    first; ordering is normalised here.
    """
    if not scored_series:
        return {'available': False, 'reason': 'No scored scans yet.'}

    ordered = sorted(scored_series, key=lambda item: item[0])
    now = timezone.now()

    decay = math.log(2) / half_life_days

    weighted_sum = 0.0
    weight_total = 0.0
    for occurred_at, score in ordered:
        age_days = max(0.0, (now - occurred_at).total_seconds() / 86400.0)
        weight = math.exp(-decay * age_days)
        weighted_sum += weight * float(score)
        weight_total += weight

    if weight_total == 0:
        return {'available': False, 'reason': 'All scans are too old to weight.'}

    current = weighted_sum / weight_total

    # Compare the newest third against the oldest third to describe movement.
    third = max(1, len(ordered) // 3)
    older_mean = float(np.mean([s for _, s in ordered[:third]]))
    newer_mean = float(np.mean([s for _, s in ordered[-third:]]))
    delta = newer_mean - older_mean

    if delta > 5:
        direction = 'worsening'
    elif delta < -5:
        direction = 'improving'
    else:
        direction = 'stable'

    return {
        'available': True,
        'exposure_score': round(current, 1),
        'direction': direction,
        'delta': round(delta, 1),
        'sample_size': len(ordered),
        'method': f'Exponentially weighted mean, {half_life_days}-day half-life',
    }


def pct_change(current, previous):
    """Period-over-period change, or None when there is no baseline.

    Returning None rather than 0 or 100 keeps the UI from showing a made-up
    percentage for a metric's very first period.
    """
    if previous in (0, None):
        return None
    return round(((current - previous) / previous) * 100, 1)
