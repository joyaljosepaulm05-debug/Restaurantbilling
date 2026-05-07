from rest_framework.permissions import BasePermission
from .models import Role


class IsOwner(BasePermission):
    """Only the restaurant Owner can access this endpoint."""
    message = "Access restricted to Owner role only."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == Role.OWNER
        )


class IsOwnerOrManager(BasePermission):
    """Owner or Manager access."""
    message = "Access restricted to Owner or Manager roles."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in [Role.OWNER, Role.MANAGER]
        )


class IsBillingStaff(BasePermission):
    """Billing staff can create/view orders at their branch."""
    message = "Access restricted to Billing Staff."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in [Role.OWNER, Role.MANAGER, Role.BILLING]
        )


class IsSameBranch(BasePermission):
    """
    WHY this exists: A manager at Branch A must NEVER see Branch B data.
    This permission is applied at the object level.
    Owners bypass this check (they own all branches).
    """
    message = "You do not have access to this branch's data."

    def has_object_permission(self, request, view, obj):
        if request.user.role == Role.OWNER:
            return True  # Owner sees everything
        # obj must have a `branch` attribute (Sale, Attendance, etc.)
        return getattr(obj, 'branch', None) == request.user.branch