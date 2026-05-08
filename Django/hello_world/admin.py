from django.contrib import admin
from .models import MenuItem, Category  # Import the new model

# Register the new Category model
admin.site.register(Category)

# Your existing MenuItem registration
class MenuItemAdmin(admin.ModelAdmin):
    # Let's add 'category' to the display so you can see it!
    list_display = ('name', 'price', 'is_available', 'category') 

admin.site.register(MenuItem, MenuItemAdmin)