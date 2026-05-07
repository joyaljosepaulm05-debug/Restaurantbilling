from django.urls import path
from . import views

urlpatterns = [
    # Individual endpoints
    path('dashboard/',   views.DashboardSummaryView.as_view(),  name='dashboard'),
    path('branches/',    views.BranchPerformanceView.as_view(), name='branch-perf'),
    path('trend/',       views.RevenueTrendView.as_view(),      name='revenue-trend'),
    path('top-items/',   views.TopItemsView.as_view(),          name='top-items'),
    path('payments/',    views.PaymentBreakdownView.as_view(),  name='payment-breakdown'),
    path('attendance/',  views.AttendanceOverviewView.as_view(),name='attendance'),
    path('top-members/', views.TopMembersView.as_view(),        name='top-members'),
    path('hourly/',      views.HourlyPatternView.as_view(),     name='hourly'),

    # Combined mobile endpoint
    path('mobile/',      views.MobileOwnerDashboardView.as_view(), name='mobile'),
]