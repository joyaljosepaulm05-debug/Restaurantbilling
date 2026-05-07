from django.db import models
from django.utils import timezone
from apps.accounts.models import User, Branch


class Attendance(models.Model):
    """
    One record per check-in OR check-out event.

    Design Decisions:

    1. WHY two separate records (not one with in/out times):
       A staff might forget to check out, or check out from a
       different device. Two records = two events. A "shift" is
       computed by pairing the CHECK_IN and CHECK_OUT records.

    2. photo_path: We save the actual photo used for check-in.
       This is the audit trail — if there's ever a dispute about
       whether someone was present, the photo is evidence.

    3. confidence_score: How confident was the face match?
       1.0 = exact match, 0.6 = threshold, below 0.6 = rejected.
       Storing this lets you audit borderline cases.

    4. device_info: Which device/camera was used.
       Useful for multi-branch setups with multiple cameras.
    """

    class AttendanceType(models.TextChoices):
        CHECK_IN  = 'CHECK_IN',  'Check In'
        CHECK_OUT = 'CHECK_OUT', 'Check Out'

    class Status(models.TextChoices):
        PRESENT  = 'PRESENT',  'Present'
        LATE     = 'LATE',     'Late'
        EARLY_OUT= 'EARLY_OUT','Early Out'

    # ── Who and Where ─────────────────────────────────────────────
    user            = models.ForeignKey(
                        User,
                        on_delete=models.PROTECT,
                        related_name='attendance_records'
                      )
    branch          = models.ForeignKey(
                        Branch,
                        on_delete=models.PROTECT,
                        related_name='attendance_records'
                      )

    # ── Event Details ─────────────────────────────────────────────
    attendance_type = models.CharField(
                        max_length=20,
                        choices=AttendanceType.choices
                      )
    status          = models.CharField(
                        max_length=20,
                        choices=Status.choices,
                        default=Status.PRESENT
                      )
    timestamp       = models.DateTimeField(default=timezone.now)

    # ── Biometric Evidence ────────────────────────────────────────
    # WHY store confidence: audit trail for borderline matches
    confidence_score = models.FloatField(
                         default=0.0,
                         help_text="1.0=exact, 0.6=threshold"
                       )
    # WHY store photo path: evidence for disputes
    photo_path       = models.CharField(
                         max_length=255,
                         blank=True,
                         help_text="Path to the captured photo"
                       )

    # ── Device Info ───────────────────────────────────────────────
    device_info     = models.CharField(max_length=100, blank=True)
    notes           = models.TextField(blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            # WHY: Daily attendance report queries by date
            models.Index(
                fields=['user', 'timestamp'],
                name='idx_attendance_user_time'
            ),
            # WHY: Branch attendance dashboard
            models.Index(
                fields=['branch', 'timestamp'],
                name='idx_attendance_branch_time'
            ),
        ]

    def __str__(self):
        return (
            f"{self.user.full_name} | "
            f"{self.attendance_type} | "
            f"{self.timestamp.strftime('%Y-%m-%d %H:%M')}"
        )