from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import CustomTokenObtainSerializer, UserSerializer, BranchSerializer
from .permissions import IsOwner, IsOwnerOrManager
from .models import User, Branch


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Returns: access token, refresh token, and user profile.
    The access token embeds role + branch for immediate frontend use.
    """
    serializer_class = CustomTokenObtainSerializer


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the refresh token so it can't be used to get new access tokens.
    WHY: JWT access tokens can't be "deleted", but we can blacklist the
    refresh token — effectively forcing re-login after 8 hours.
    """
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'detail': 'Successfully logged out.'},
                status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MeView(APIView):
    """
    GET /api/auth/me/
    Returns the current user's profile.
    Used by the frontend to refresh user data without re-login.
    """
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/users/       → List all users (Owner sees all, Manager sees branch)
    POST /api/users/       → Create a new staff member
    """
    serializer_class = UserSerializer
    permission_classes = [IsOwnerOrManager]

    def get_queryset(self):
        user = self.request.user
        # WHY this filter: Managers should only see their branch's staff
        if user.is_owner:
            return User.objects.select_related('branch').all()
        return User.objects.select_related('branch').filter(branch=user.branch)


class BranchListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/branches/    → List all branches
    POST /api/branches/    → Create a new branch (Owner only)
    """
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsOwner]