from django.db import models
from apps.accounts.models import User, Branch


class AdminAuditLog(models.Model):
    """
    Records all admin-level actions.
    Sale/stock/credit events are already tracked on their own
    models via created_by FK. This table covers:
    - user creation / role change / deactivation
    - branch creation / deactivation
    - login / logout events
    - password resets
    - face registration
    """

    class ActionType(models.TextChoices):
        USER_CREATED      = 'USER_CREATED',      'User created'
        USER_UPDATED      = 'USER_UPDATED',      'User updated'
        USER_DEACTIVATED  = 'USER_DEACTIVATED',  'User deactivated'
        USER_ACTIVATED    = 'USER_ACTIVATED',    'User activated'
        PASSWORD_RESET    = 'PASSWORD_RESET',    'Password reset'
        FACE_REGISTERED   = 'FACE_REGISTERED',   'Face registered'
        BRANCH_CREATED    = 'BRANCH_CREATED',    'Branch created'
        BRANCH_UPDATED    = 'BRANCH_UPDATED',    'Branch updated'
        BRANCH_TOGGLED    = 'BRANCH_TOGGLED',    'Branch activated/deactivated'
        LOGIN             = 'LOGIN',             'Login'
        LOGOUT            = 'LOGOUT',            'Logout'

    performed_by    = models.ForeignKey(
                        User,
                        on_delete=models.SET_NULL,
                        null=True,
                        related_name='admin_actions'
                      )
    action_type     = models.CharField(
                        max_length=30,
                        choices=ActionType.choices
                      )
    target_user     = models.ForeignKey(
                        User,
                        on_delete=models.SET_NULL,
                        null=True, blank=True,
                        related_name='admin_actions_received'
                      )
    target_branch   = models.ForeignKey(
                        Branch,
                        on_delete=models.SET_NULL,
                        null=True, blank=True,
                        related_name='admin_actions'
                      )
    description     = models.CharField(max_length=255)
    # Extra context: old_role, new_role, bill_number, amount...
    metadata        = models.JSONField(default=dict, blank=True)
    ip_address      = models.GenericIPAddressField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['performed_by', 'created_at'],
                         name='idx_audit_user_date'),
            models.Index(fields=['action_type'],
                         name='idx_audit_action'),
        ]

    def __str__(self):
        return f"{self.performed_by} → {self.action_type} @ {self.created_at}"