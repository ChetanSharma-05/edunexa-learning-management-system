from rest_framework.permissions import BasePermission


class IsAdminOrTeacher(BasePermission):
    message = "Only admin or teacher can perform this action."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return request.user.role in [
            "ADMIN",
            "TEACHER",
        ]


class IsAdminOnly(BasePermission):
    message = "Only admin can perform this action."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return request.user.role == "ADMIN"


class IsTeacherOnly(BasePermission):
    message = "Only teacher can perform this action."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return request.user.role == "TEACHER"


class IsStudentOnly(BasePermission):
    message = "Only student can perform this action."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return request.user.role == "STUDENT"


class IsAdminOrTeacherOrStudent(BasePermission):
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return request.user.role in [
            "ADMIN",
            "TEACHER",
            "STUDENT",
        ]