# apps/accounts/apps.py
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'          # ← MUST match the full dotted path
    label = 'accounts'              # ← Short label for migrations folder name