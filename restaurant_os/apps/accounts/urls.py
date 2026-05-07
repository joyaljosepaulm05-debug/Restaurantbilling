from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth endpoints
    path('auth/login/',    views.LoginView.as_view(),   name='login'),
    path('auth/logout/',   views.LogoutView.as_view(),  name='logout'),
    path('auth/refresh/',  TokenRefreshView.as_view(),  name='token_refresh'),
    path('auth/me/',       views.MeView.as_view(),      name='me'),

    # User & Branch management
    path('users/',         views.UserListCreateView.as_view(),   name='users'),
    path('branches/',      views.BranchListCreateView.as_view(), name='branches'),
]