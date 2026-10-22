from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = (
        "username",
        "full_name",
        "email",
        "role",
        "is_active",
    )

    list_filter = (
        "role",
        "is_active",
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            "EduNexa Information",
            {
                "fields": (
                    "full_name",
                    "role",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "EduNexa Information",
            {
                "fields": (
                    "full_name",
                    "email",
                    "role",
                )
            },
        ),
    )