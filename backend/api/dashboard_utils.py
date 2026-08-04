from datetime import timedelta

from django.db.models import Count
from django.utils import timezone

from .models import ScanLog
from .serializers import ScanLogSerializer


def compute_dashboard_stats(user):
    """Real stats computed from ScanLog — no seeded/fabricated rows.

    Shared by DashboardStatsView (REST) and the DashboardConsumer (WebSocket
    push on every new scan) so both surfaces always agree.
    """
    if user is not None:
        logs = ScanLog.objects.filter(user=user)
    else:
        logs = ScanLog.objects.filter(user__isnull=True)

    total_scans = logs.count()

    threats = logs.exclude(risk_level='Low')
    total_threats = threats.count()

    avg_risk = sum(log.risk_score for log in logs) / max(1, total_scans)

    scan_type_counts = logs.values('scan_type').annotate(count=Count('id'))
    types_dict = {item['scan_type']: item['count'] for item in scan_type_counts}

    risk_level_counts = logs.values('risk_level').annotate(count=Count('id'))
    risk_dict = {item['risk_level']: item['count'] for item in risk_level_counts}

    recent_scans = ScanLogSerializer(logs[:8], many=True).data

    chart_data = []
    for i in range(6, -1, -1):
        date = timezone.now().date() - timedelta(days=i)
        day_logs = logs.filter(created_at__date=date)
        chart_data.append({
            "date": date.strftime("%b %d"),
            "scans": day_logs.count(),
            "threats": day_logs.exclude(risk_level='Low').count()
        })

    return {
        "total_scans": total_scans,
        "total_threats": total_threats,
        "avg_risk": round(avg_risk, 1),
        "threats_percentage": round((total_threats / max(1, total_scans)) * 100, 1),
        "types_distribution": {
            "text": types_dict.get('TEXT', 0),
            "url": types_dict.get('URL', 0),
            "screenshot": types_dict.get('SCREENSHOT', 0),
        },
        "risk_distribution": {
            "low": risk_dict.get('Low', 0),
            "medium": risk_dict.get('Medium', 0),
            "high": risk_dict.get('High', 0),
            "critical": risk_dict.get('Critical', 0),
        },
        "chart_data": chart_data,
        "recent_scans": recent_scans,
    }
