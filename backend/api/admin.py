# api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    # 'is_approved' has been removed from the list_display
    list_display = ['username', 'email', 'name', 'is_active']
    # 'is_approved' has been removed from the list_filter
    list_filter = ['is_active', 'role']
    # 'is_approved' has been removed from the fieldsets
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role',)}),
    )

admin.site.register(CustomUser, CustomUserAdmin)