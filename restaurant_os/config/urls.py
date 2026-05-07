from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.accounts.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/billing/',    include('apps.billing.urls')),
    path('api/members/',    include('apps.members.urls')), 
    path('api/attendance/',   include('apps.attendance.urls')), 
    path('api/analytics/',   include('apps.analytics.urls')),
]