from django.urls import path
from . import views

urlpatterns = [
    # Users
    path('users/',
         views.AdminUserListCreateView.as_view(),
         name='admin-users'),
    path('users/<int:pk>/',
         views.AdminUserDetailView.as_view(),
         name='admin-user-detail'),
    path('users/<int:pk>/reset-password/',
         views.AdminResetPasswordView.as_view(),
         name='admin-reset-password'),

    # Branches
    path('branches/',
         views.AdminBranchListCreateView.as_view(),
         name='admin-branches'),
    path('branches/<int:pk>/',
         views.AdminBranchDetailView.as_view(),
         name='admin-branch-detail'),

    # Reports
    path('audit-log/',
         views.AdminAuditLogView.as_view(),
         name='admin-audit-log'),
    path('sales-report/',
         views.SalesByUserView.as_view(),
         name='admin-sales-report'),
    path('permissions/',
         views.PermissionReferenceView.as_view(),
         name='admin-permissions'),
]