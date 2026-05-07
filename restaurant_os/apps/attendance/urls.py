from django.urls import path
from . import views

urlpatterns = [
    # Register a staff member's face (onboarding)
    path('register-face/',  views.RegisterFaceView.as_view(),    name='register-face'),

    # Check in / Check out (public — face is auth)
    path('verify/',         views.CheckInOutView.as_view(),      name='verify-face'),

    # Manager views
    path('today/',          views.TodayAttendanceView.as_view(),  name='today-attendance'),
    path('summary/',        views.AttendanceSummaryView.as_view(),name='attendance-summary'),
]