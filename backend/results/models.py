from django.conf import settings
from django.db import models


class Result(models.Model):

    class Status(models.TextChoices):
        PASS = "PASS", "Pass"
        FAIL = "FAIL", "Fail"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="test_results"
    )

    test = models.ForeignKey(
        "testsystem.Test",
        on_delete=models.CASCADE,
        related_name="results"
    )

    obtained_marks = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0
    )

    total_marks = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0
    )

    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
    )

    passing_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=40
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.FAIL
    )

    correct_answers = models.PositiveIntegerField(
        default=0
    )

    wrong_answers = models.PositiveIntegerField(
        default=0
    )

    unanswered = models.PositiveIntegerField(
        default=0
    )

    submitted_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-submitted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "test"],
                name="unique_result_per_student_test"
            )
        ]

    def __str__(self):
        return f"{self.student} - {self.test}"