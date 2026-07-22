from rest_framework import permissions

class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

class IsEnterprise(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        try:
            return request.user.profile.role in ['enterprise', 'admin'] or request.user.is_superuser
        except AttributeError:
            return request.user.is_superuser

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        try:
            return request.user.profile.role == 'admin' or request.user.is_staff or request.user.is_superuser
        except AttributeError:
            return request.user.is_staff or request.user.is_superuser
