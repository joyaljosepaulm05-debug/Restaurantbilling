from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User, Branch


class CustomTokenObtainSerializer(TokenObtainPairSerializer):
    """
    Extends the default JWT serializer to embed
    role, branch_id, and branch_name into the token payload.
    The frontend reads these claims to drive UI decisions.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # ─── Custom claims embedded in JWT payload ──────────────────────
        token['full_name']  = user.full_name
        token['role']       = user.role
        token['branch_id']  = user.branch_id          # FK id (int or null)
        token['branch_name'] = user.branch.name if user.branch else 'All Branches'

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Also return user info in the response body (not just in token)
        data['user'] = {
            'id':          self.user.id,
            'email':       self.user.email,
            'full_name':   self.user.full_name,
            'role':        self.user.role,
            'branch_id':   self.user.branch_id,
            'branch_name': self.user.branch.name if self.user.branch else 'All Branches',
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone',
            'role', 'branch', 'branch_name', 'is_active', 'date_joined'
        ]
        read_only_fields = ['date_joined']


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'