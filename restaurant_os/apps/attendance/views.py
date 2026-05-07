from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.models import User, Branch
from apps.accounts.permissions import IsOwnerOrManager, IsBillingStaff
from services.attendance_service import AttendanceService
from .models import Attendance
from .serializers import (
    AttendanceSerializer, RegisterFaceSerializer, VerifyFaceSerializer
)


class RegisterFaceView(APIView):
    """
    POST /api/attendance/register-face/

    Manager takes a clear photo of a staff member and
    sends it to register their face encoding.

    Called ONCE per staff member during onboarding.
    The 128-float encoding is saved to User.face_encoding (JSONB).
    """
    permission_classes = [IsOwnerOrManager]

    def post(self, request):
        serializer = RegisterFaceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(
                id=serializer.validated_data['user_id'],
                is_active=True
            )
        except User.DoesNotExist:
            return Response(
                {'success': False, 'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            result = AttendanceService.register_face(
                user       = user,
                image_data = serializer.validated_data['image_data'],
            )
            return Response(result, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ImportError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )


class CheckInOutView(APIView):
    """
    POST /api/attendance/verify/

    The main attendance endpoint. Called by the attendance
    device/app when a staff member stands in front of the camera.

    No authentication required — the face IS the authentication.
    The system identifies the person from their face.

    WHY no auth: The attendance terminal is a public kiosk.
    Staff don't log in first — they just look at the camera.
    """
    permission_classes = []   # ← Public endpoint (face is the auth)
    authentication_classes = []

    def post(self, request):
        serializer = VerifyFaceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine branch
        branch_id = serializer.validated_data.get('branch_id')
        if branch_id:
            try:
                branch = Branch.objects.get(id=branch_id, is_active=True)
            except Branch.DoesNotExist:
                return Response(
                    {'success': False, 'error': 'Branch not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Default to branch 1 for single-branch setup
            try:
                branch = Branch.objects.filter(is_active=True).first()
                if not branch:
                    raise ValueError("No active branch found.")
            except Exception as e:
                return Response(
                    {'success': False, 'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            result = AttendanceService.verify_and_mark(
                image_data      = serializer.validated_data['image_data'],
                branch          = branch,
                attendance_type = serializer.validated_data['attendance_type'],
                device_info     = serializer.validated_data.get('device_info', ''),
            )

            http_status = (
                status.HTTP_200_OK
                if result['success']
                else status.HTTP_403_FORBIDDEN
            )
            return Response(result, status=http_status)

        except ValueError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ImportError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )


class TodayAttendanceView(APIView):
    """
    GET /api/attendance/today/
    Returns today's attendance for manager dashboard.
    """
    permission_classes = [IsOwnerOrManager]

    def get(self, request):
        branch = request.user.branch
        if not branch and not request.user.is_owner:
            return Response(
                {'error': 'No branch assigned.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Owner can query any branch via ?branch_id=
        branch_id = request.query_params.get('branch_id')
        if branch_id:
            try:
                branch = Branch.objects.get(id=branch_id)
            except Branch.DoesNotExist:
                return Response({'error': 'Branch not found.'}, status=404)

        records = AttendanceService.get_today_attendance(branch)
        return Response({'success': True, 'records': records})


class AttendanceSummaryView(APIView):
    """
    GET /api/attendance/summary/
    Returns present vs absent summary for the day.
    """
    permission_classes = [IsOwnerOrManager]

    def get(self, request):
        branch = request.user.branch

        branch_id = request.query_params.get('branch_id')
        if branch_id:
            try:
                branch = Branch.objects.get(id=branch_id)
            except Branch.DoesNotExist:
                return Response({'error': 'Branch not found.'}, status=404)

        if not branch:
            return Response({'error': 'branch_id required.'}, status=400)

        summary = AttendanceService.get_staff_summary(branch)
        return Response({'success': True, **summary})