from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    user_name   = serializers.CharField(
                    source='user.full_name', read_only=True)
    branch_name = serializers.CharField(
                    source='branch.name', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'user', 'user_name', 'branch', 'branch_name',
            'attendance_type', 'status', 'timestamp',
            'confidence_score', 'device_info', 'notes',
        ]
        read_only_fields = ['timestamp']


class RegisterFaceSerializer(serializers.Serializer):
    """
    Receives a base64-encoded photo for face registration.
    The target user is identified by user_id.
    """
    user_id    = serializers.IntegerField()
    image_data = serializers.CharField(
                   help_text="Base64 encoded image string"
                 )

    def validate_image_data(self, value):
        # Basic check: base64 strings are long
        clean = value.split(',')[-1]  # Remove data URI prefix
        if len(clean) < 100:
            raise serializers.ValidationError(
                "Image data appears too short. "
                "Please provide a valid base64 image."
            )
        return value


class VerifyFaceSerializer(serializers.Serializer):
    """
    Receives a photo and attendance type for check-in/out.
    """
    image_data      = serializers.CharField()
    attendance_type = serializers.ChoiceField(
                        choices=Attendance.AttendanceType.choices,
                        default=Attendance.AttendanceType.CHECK_IN
                      )
    device_info     = serializers.CharField(
                        max_length=100,
                        required=False,
                        allow_blank=True
                      )
    # Owner can specify branch; staff uses their own branch
    branch_id       = serializers.IntegerField(required=False)