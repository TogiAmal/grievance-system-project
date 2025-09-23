# api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    # Add 'is_approved' to the list display and make it editable
    list_display = ['username', 'email', 'name', 'is_active', 'is_approved']
    list_filter = ['is_active', 'is_approved', 'role']
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role', 'is_approved')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role', 'is_approved')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)