from django.conf import settings
from django.db import models


class Test(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PUBLISHED = "PUBLISHED", "Published"
        CLOSED = "CLOSED", "Closed"

    title = models.CharField(max_length=200)

    description = models.TextField(
        blank=True,
        default=""
    )

    subject = models.ForeignKey(
        "subjects.Subject",
        on_delete=models.CASCADE,
        related_name="tests"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_tests"
    )

    duration_minutes = models.PositiveIntegerField(
        default=30
    )

    total_marks = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0
    )

    passing_marks = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0
    )

    start_date = models.DateTimeField(
        null=True,
        blank=True
    )

    end_date = models.DateTimeField(
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )

    shuffle_questions = models.BooleanField(
        default=False
    )

    show_result_immediately = models.BooleanField(
        default=True
    )

    allow_retake = models.BooleanField(
        default=False
    )

    max_attempts = models.PositiveIntegerField(
        default=1
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class TestQuestion(models.Model):
    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name="test_questions"
    )

    question = models.ForeignKey(
        "question_bank.Question",
        on_delete=models.CASCADE,
        related_name="test_questions"
    )

    order = models.PositiveIntegerField(
        default=1
    )

    marks = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        default=1
    )

    negative_marks = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        default=0
    )

    class Meta:
        ordering = ["order"]

        constraints = [
            models.UniqueConstraint(
                fields=["test", "question"],
                name="unique_question_per_test"
            )
        ]

    def __str__(self):
        return f"{self.test.title} - Question {self.order}"


class TestAttempt(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        SUBMITTED = "SUBMITTED", "Submitted"
        AUTO_SUBMITTED = "AUTO_SUBMITTED", "Auto Submitted"

    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name="attempts"
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="test_attempts"
    )

    attempt_number = models.PositiveIntegerField(
        default=1
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS
    )

    started_at = models.DateTimeField(
        auto_now_add=True
    )

    submitted_at = models.DateTimeField(
        null=True,
        blank=True
    )

    score = models.DecimalField(
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
        max_digits=6,
        decimal_places=2,
        default=0
    )

    is_passed = models.BooleanField(
        default=False
    )

    class Meta:
        ordering = ["-started_at"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "test",
                    "student",
                    "attempt_number"
                ],
                name="unique_student_test_attempt"
            )
        ]

    def __str__(self):
        return (
            f"{self.student.username} - "
            f"{self.test.title} - "
            f"Attempt {self.attempt_number}"
        )


class TestAttemptAnswer(models.Model):
    attempt = models.ForeignKey(
        TestAttempt,
        on_delete=models.CASCADE,
        related_name="answers"
    )

    question = models.ForeignKey(
        "question_bank.Question",
        on_delete=models.CASCADE,
        related_name="attempt_answers"
    )

    selected_option = models.ForeignKey(
        "question_bank.QuestionOption",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attempt_answers"
    )

    written_answer = models.TextField(
        blank=True,
        default=""
    )

    marks_obtained = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        default=0
    )

    is_correct = models.BooleanField(
        null=True,
        blank=True
    )

    answered_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "attempt",
                    "question"
                ],
                name="unique_answer_per_attempt_question"
            )
        ]

    def __str__(self):
        return (
            f"{self.attempt} - "
            f"Question {self.question_id}"
        )