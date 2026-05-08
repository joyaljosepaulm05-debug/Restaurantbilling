from django.contrib import admin
from django.urls import path, include # Import 'include'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')), # Restores Login/Logout
    path('', include('hello_world.urls')), # Connects your app's urls.py
]