from django.conf import settings
from django.db import models


class StudentProfile(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile"
    )

    admission_id = models.CharField(
        max_length=50,
        unique=True
    )

    roll_number = models.CharField(
        max_length=50,
        blank=True
    )

    phone = models.CharField(
        max_length=20,
        blank=True
    )

    course = models.CharField(
        max_length=150,
        blank=True
    )

    class_name = models.CharField(
        max_length=100,
        blank=True
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_students"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return (
            f"{self.user.full_name} - "
            f"{self.admission_id}"
        )