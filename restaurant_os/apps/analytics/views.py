from datetime import date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.accounts.permissions import IsOwner
from services.analytics_service import AnalyticsService


class DashboardSummaryView(APIView):
    """
    GET /api/analytics/dashboard/
    GET /api/analytics/dashboard/?date=2026-04-24

    The first screen the owner sees.
    Today's revenue, bills, average bill, trend vs yesterday.
    """
    permission_classes = [IsOwner]

    def get(self, request):
        date_str    = request.query_params.get('date')
        target_date = date.fromisoformat(date_str) if date_str else None

        data = AnalyticsService.get_dashboard_summary(
            owner=request.user,
            target_date=target_date
        )
        return Response({'success': True, **data})


class BranchPerformanceView(APIView):
    """
    GET /api/analytics/branches/
    GET /api/analytics/branches/?date=2026-04-24

    Side-by-side branch comparison.
    Which branch made the most today?
    """
    permission_classes = [IsOwner]

    def get(self, request):
        date_str    = request.query_params.get('date')
        target_date = date.fromisoformat(date_str) if date_str else None

        data = AnalyticsService.get_branch_performance(
            target_date=target_date
        )
        return Response({'success': True, 'branches': data})


class RevenueTrendView(APIView):
    """
    GET /api/analytics/trend/
    GET /api/analytics/trend/?days=30&branch_id=1

    Daily revenue for last N days.
    Powers the line chart.
    """
    permission_classes = [IsOwner]

    def get(self, request):
        days      = int(request.query_params.get('days', 7))
        branch_id = request.query_params.get('branch_id')

        data = AnalyticsService.get_revenue_trend(
            days=days,
            branch_id=branch_id
        )
        return Response({'success': True, 'trend': data})


class TopItemsView(APIView):
    """
    GET /api/analytics/top-items/
    GET /api/analytics/top-items/?days=7&limit=5&branch_id=1

    Best selling items. Powers the bestsellers card.
    """
    permission_classes = [IsOwner]

    def get(self, request):
        limit     = int(request.query_params.get('limit', 10))
        days      = int(request.query_params.get('days', 7))
        branch_id = request.query_params.get('branch_id')

        data = AnalyticsService.get_top_items(
            limit=limit,
            days=days,
            branch_id=branch_id
        )
        return Response({'success': True, 'items': data})


class PaymentBreakdownView(APIView):
    """
    GET /api/analytics/payments/
    Cash vs UPI vs Card vs Credit breakdown.
    """
    permission_classes = [IsOwner]

    def get(self, request):
        date_str  = request.query_params.get('date')
        branch_id = request.query_params.get('branch_id')
        target_date = date.fromisoformat(date_str) if date_str else None

        data = AnalyticsService.get_payment_breakdown(
            target_date=target_date,
            branch_id=branch_id
        )
        return Response({'success': True, 'payments': data})


class AttendanceOverviewView(APIView):
    """
    GET /api/analytics/attendance/
    Staff attendance summary across all branches.
    """
    permission_classes = [IsOwner]

    def get(self, request):
        date_str = request.query_params.get('date')
        target_date = date.fromisoformat(date_str) if date_str else None

        data = AnalyticsService.get_attendance_overview(
            target_date=target_date
        )
        return Response({'success': True, **data})


class TopMembersView(APIView):
    """
    GET /api/analytics/top-members/
    Most valuable loyalty members by spend.
    """
    permission_classes = [IsOwner]

    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        days  = int(request.query_params.get('days', 30))

        data = AnalyticsService.get_top_members(
            limit=limit,
            days=days
        )
        return Response({'success': True, 'members': data})


class HourlyPatternView(APIView):
    """
    GET /api/analytics/hourly/
    Sales volume by hour. Staffing intelligence.
    """
    permission_classes = [IsOwner]

    def get(self, request):
        date_str  = request.query_params.get('date')
        branch_id = request.query_params.get('branch_id')
        target_date = date.fromisoformat(date_str) if date_str else None

        data = AnalyticsService.get_hourly_pattern(
            target_date=target_date,
            branch_id=branch_id
        )
        return Response({'success': True, 'hourly': data})


class MobileOwnerDashboardView(APIView):
    """
    GET /api/analytics/mobile/

    Single endpoint that returns EVERYTHING the mobile app
    needs in ONE request. Minimises network round trips.

    WHY one combined endpoint for mobile:
    Mobile apps on 4G pay a high latency cost per request.
    7 separate requests × 200ms each = 1.4 seconds of loading.
    1 combined request = 200ms. Always combine for mobile.
    """
    permission_classes = [IsOwner]

    def get(self, request):
        today     = date.today()
        branch_id = request.query_params.get('branch_id')

        return Response({
            'success':    True,
            'generated':  today.isoformat(),
            'summary':    AnalyticsService.get_dashboard_summary(
                              owner=request.user
                          ),
            'branches':   AnalyticsService.get_branch_performance(),
            'trend':      AnalyticsService.get_revenue_trend(days=7),
            'top_items':  AnalyticsService.get_top_items(
                              limit=5, days=7
                          ),
            'payments':   AnalyticsService.get_payment_breakdown(),
            'attendance': AnalyticsService.get_attendance_overview(),
            'top_members':AnalyticsService.get_top_members(
                              limit=5, days=30
                          ),
        })