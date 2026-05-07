from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class Role(models.TextChoices):
    """
    WHY TextChoices: Stored as readable strings in DB ('OWNER', not 1).
    This makes SQL queries and reports human-readable.
    """
    OWNER        = 'OWNER',        'Owner'
    MANAGER      = 'MANAGER',      'Manager'
    BILLING      = 'BILLING',      'Billing Staff'
    INVENTORY    = 'INVENTORY',    'Inventory Staff'


class Branch(models.Model):
    """
    WHY separate Branch model: In Phase 1 a restaurant might have 1 branch.
    By Phase 3, they'll have 10. The foundation must support both.
    """
    name       = models.CharField(max_length=100)
    address    = models.TextField(blank=True)
    phone      = models.CharField(max_length=20, blank=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Branches'

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    """
    WHY custom manager: We replaced username with email as the login field.
    Django's default manager doesn't know this — we must teach it.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Hashes the password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', Role.OWNER)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    The central User model for the entire Restaurant OS.

    Design Decisions:
    - email as USERNAME_FIELD: Professional, unique across the system
    - branch: NULL for Owner (sees all), required for staff
    - face_encoding: JSONB stores a 128-float array for face recognition
    - role: Drives all permission checks across the system
    """
    email          = models.EmailField(unique=True)
    full_name      = models.CharField(max_length=150)
    phone          = models.CharField(max_length=20, blank=True)

    # RBAC Fields
    role           = models.CharField(
                        max_length=20,
                        choices=Role.choices,
                        default=Role.BILLING
                    )
    branch         = models.ForeignKey(
                        Branch,
                        on_delete=models.SET_NULL,
                        null=True,
                        blank=True,
                        related_name='staff'
                    )

    # Biometric Data (Phase 5)
    # WHY JSONB: A face encoding is a list of 128 floats.
    # JSONB stores it natively in PostgreSQL with compression.
    # Querying it later is far faster than a TextField with JSON string.
    face_encoding  = models.JSONField(null=True, blank=True)

    # Standard Django fields
    is_active      = models.BooleanField(default=True)
    is_staff       = models.BooleanField(default=False)
    date_joined    = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        indexes = [
            # WHY index role: Every permission check queries this field
            models.Index(fields=['role'], name='idx_user_role'),
            # WHY index branch: Every branch-filtered query uses this
            models.Index(fields=['branch'], name='idx_user_branch'),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.role}) — {self.branch}"

    @property
    def is_owner(self):
        return self.role == Role.OWNER

    @property
    def is_manager(self):
        return self.role == Role.MANAGER