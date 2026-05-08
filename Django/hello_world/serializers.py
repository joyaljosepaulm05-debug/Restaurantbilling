from rest_framework import serializers
from .models import MenuItem

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        # These are the specific "facts" we want to share with other apps
        fields = ['id', 'name', 'price']