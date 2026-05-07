import io
import os
import base64
import logging
from datetime import date
from django.db import transaction
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)


class AttendanceService:
    """
    All face recognition and attendance logic lives here.

    Two main operations:
    1. register_face   → encode a staff member's face and save to User
    2. verify_and_mark → identify who is in a photo and mark attendance
    """

    # How close two encodings must be to count as the same person.
    # 0.6 is the standard threshold used by face_recognition library.
    # Lower = stricter (fewer false positives, more false negatives)
    MATCH_THRESHOLD = 0.6

    @staticmethod
    def _load_face_recognition():
        """
        WHY lazy import:
        face_recognition imports dlib which takes ~2 seconds to load.
        We only pay that cost when actually using face recognition,
        not on every Django startup request.
        """
        try:
            import face_recognition
            return face_recognition
        except ImportError:
            raise ImportError(
                "face_recognition library not installed. "
                "Run: pip install face_recognition"
            )

    @staticmethod
    def _decode_image(image_data: str):
        """
        Accepts image as:
        - Base64 string: "data:image/jpeg;base64,/9j/4AAQ..."
        - Raw base64:    "/9j/4AAQ..."

        Returns a numpy array (what face_recognition expects).
        WHY base64: Mobile apps and web browsers can send images
        as base64 strings in JSON — no multipart form needed.
        """
        fr = AttendanceService._load_face_recognition()

        # Strip the data URI prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        image_bytes = base64.b64decode(image_data)
        image = fr.load_image_file(io.BytesIO(image_bytes))
        return image

    @staticmethod
    def register_face(user, image_data: str) -> dict:
        """
        Encodes a staff member's face and saves it to their User profile.

        Called ONCE per staff member during onboarding.
        The manager takes a clear frontal photo and calls this endpoint.

        Steps:
        1. Decode the base64 image
        2. Detect faces in the image
        3. Extract the 128-float encoding
        4. Save to user.face_encoding (JSONB field)

        WHY we raise errors for 0 or 2+ faces:
        - 0 faces: bad photo (dark, blurry, no face visible)
        - 2+ faces: ambiguous (whose encoding do we save?)
        """
        fr = AttendanceService._load_face_recognition()
        image = AttendanceService._decode_image(image_data)

        # Detect face locations first
        face_locations = fr.face_locations(image)

        if len(face_locations) == 0:
            raise ValueError(
                "No face detected in the image. "
                "Please ensure: good lighting, face clearly visible, "
                "no obstructions."
            )

        if len(face_locations) > 1:
            raise ValueError(
                f"{len(face_locations)} faces detected. "
                "Please provide a photo with only one person."
            )

        # Extract the encoding (128 floats)
        encodings = fr.face_encodings(image, face_locations)
        encoding = encodings[0]

        # Save to user profile
        # .tolist() converts numpy array → Python list → JSON-serializable
        with transaction.atomic():
            user.face_encoding = encoding.tolist()
            user.save(update_fields=['face_encoding'])

        return {
            'success':  True,
            'user':     user.full_name,
            'message':  f"Face registered for {user.full_name}.",
            'encoding_length': len(encoding),  # Should always be 128
        }

    @staticmethod
    def verify_and_mark(image_data: str, branch,
                        attendance_type: str, device_info: str = '') -> dict:
        """
        The main attendance check-in/out function.

        Steps:
        1. Decode the image
        2. Extract encoding from the image
        3. Load ALL staff encodings from the database
        4. Compare: find the closest match
        5. If match found → create Attendance record
        6. Return result

        WHY load all encodings:
        We don't know WHO is standing at the camera.
        We must compare against everyone to find the match.
        With 50 staff members, this is 50 comparisons — very fast.
        With 500 staff, still fast (milliseconds).
        """
        from apps.accounts.models import User
        from apps.attendance.models import Attendance

        fr = AttendanceService._load_face_recognition()
        import numpy as np

        # ── Step 1: Extract encoding from the incoming photo ──────
        image = AttendanceService._decode_image(image_data)
        face_locations = fr.face_locations(image)

        if len(face_locations) == 0:
            raise ValueError(
                "No face detected. Please look directly at the camera."
            )

        incoming_encoding = fr.face_encodings(image, face_locations)[0]

        # ── Step 2: Load all staff with registered faces ──────────
        # WHY filter face_encoding__isnull=False:
        # New staff who haven't registered yet are excluded.
        # Only compare against registered faces.
        staff_with_faces = User.objects.filter(
            is_active=True,
            face_encoding__isnull=False,
            branch=branch          # Only compare against THIS branch's staff
        ).values('id', 'full_name', 'role', 'face_encoding')

        if not staff_with_faces:
            raise ValueError(
                "No registered faces found for this branch. "
                "Staff must register their faces first."
            )

        # ── Step 3: Compare incoming face against all stored faces ─
        best_match_user_id   = None
        best_match_name      = None
        best_match_distance  = float('inf')  # Start with infinity

        for staff in staff_with_faces:
            stored_encoding = np.array(staff['face_encoding'])

            # face_distance returns a number:
            # 0.0 = identical, 0.6 = threshold, 1.0+ = definitely different
            distance = fr.face_distance(
                [stored_encoding],
                incoming_encoding
            )[0]

            if distance < best_match_distance:
                best_match_distance  = distance
                best_match_user_id   = staff['id']
                best_match_name      = staff['full_name']

        # ── Step 4: Check if best match is within threshold ───────
        if best_match_distance > AttendanceService.MATCH_THRESHOLD:
            return {
                'success':    False,
                'identified': False,
                'message':    'Face not recognized. Access denied.',
                'distance':   round(best_match_distance, 4),
            }

        # ── Step 5: Found a match → create attendance record ──────
        confidence = round(
            (1 - best_match_distance) * 100, 2
        )  # Convert distance to percentage: 0.1 distance = 90% confidence

        matched_user = User.objects.get(id=best_match_user_id)

        # Determine status (LATE if checking in after 9:30 AM)
        now = timezone.now()
        status = Attendance.Status.PRESENT
        if attendance_type == Attendance.AttendanceType.CHECK_IN:
            shift_start_hour = 9
            shift_start_minute = 30
            if (now.hour > shift_start_hour or
                (now.hour == shift_start_hour and
                 now.minute > shift_start_minute)):
                status = Attendance.Status.LATE

        with transaction.atomic():
            record = Attendance.objects.create(
                user            = matched_user,
                branch          = branch,
                attendance_type = attendance_type,
                status          = status,
                timestamp       = now,
                confidence_score= best_match_distance,
                device_info     = device_info,
            )

        return {
            'success':          True,
            'identified':       True,
            'user_id':          matched_user.id,
            'full_name':        matched_user.full_name,
            'role':             matched_user.role,
            'attendance_type':  attendance_type,
            'status':           status,
            'confidence':       f"{confidence}%",
            'timestamp':        record.timestamp.isoformat(),
            'record_id':        record.id,
        }

    @staticmethod
    def get_today_attendance(branch) -> list:
        """
        Returns today's attendance for a branch.
        Used by the manager dashboard.
        """
        from apps.attendance.models import Attendance

        today = date.today()
        records = (
            Attendance.objects
            .filter(branch=branch, timestamp__date=today)
            .select_related('user')
            .order_by('user', 'timestamp')
        )

        return [
            {
                'user_id':         r.user.id,
                'full_name':       r.user.full_name,
                'role':            r.user.role,
                'attendance_type': r.attendance_type,
                'status':          r.status,
                'timestamp':       r.timestamp.isoformat(),
                'confidence':      f"{round((1-r.confidence_score)*100,1)}%",
            }
            for r in records
        ]

    @staticmethod
    def get_staff_summary(branch, target_date=None) -> dict:
        """
        Returns a summary: who checked in, who didn't.
        """
        from apps.attendance.models import Attendance
        from apps.accounts.models import User

        target_date = target_date or date.today()

        # All active staff at this branch
        all_staff = User.objects.filter(
            branch=branch,
            is_active=True
        ).values('id', 'full_name', 'role')

        # Who checked in today
        checked_in_ids = set(
            Attendance.objects.filter(
                branch=branch,
                timestamp__date=target_date,
                attendance_type=Attendance.AttendanceType.CHECK_IN
            ).values_list('user_id', flat=True)
        )

        present = []
        absent  = []

        for staff in all_staff:
            entry = {
                'user_id':   staff['id'],
                'full_name': staff['full_name'],
                'role':      staff['role'],
            }
            if staff['id'] in checked_in_ids:
                present.append(entry)
            else:
                absent.append(entry)

        return {
            'date':          target_date.isoformat(),
            'branch':        branch.name,
            'total_staff':   len(all_staff),
            'present_count': len(present),
            'absent_count':  len(absent),
            'present':       present,
            'absent':        absent,
        }