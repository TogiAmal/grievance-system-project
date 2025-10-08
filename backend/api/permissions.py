# api/permissions.py
from rest_framework import permissions

class IsAdminOrGrievanceCell(permissions.BasePermission):
    """
    Custom permission to only allow users with 'admin' or 'grievance_cell' role.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'grievance_cell']

class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access it,
    but also allows access for admins.
    """
    def has_object_permission(self, request, view, obj):
        # Admins and grievance cell members can access any object.
        if request.user.role in ['admin', 'grievance_cell']:
            return True
        
        # Write permissions are only allowed to the owner of the object.
        return obj.submitted_by == request.user