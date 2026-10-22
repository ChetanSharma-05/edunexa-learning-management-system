from django.contrib import admin

from .models import Test, TestQuestion


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "subject",
        "created_by",
        "duration_minutes",
        "total_marks",
        "status",
        "is_active",
        "created_at",
    )

    list_filter = (
        "status",
        "is_active",
        "shuffle_questions",
        "show_result_immediately",
        "allow_retake",
        "subject",
    )

    search_fields = (
        "title",
        "description",
        "subject__name",
        "created_by__username",
        "created_by__full_name",
    )

    readonly_fields = (
        "total_marks",
        "created_at",
        "updated_at",
    )

    ordering = (
        "-created_at",
    )


@admin.register(TestQuestion)
class TestQuestionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "test",
        "question",
        "order",
        "marks",
        "negative_marks",
    )

    list_filter = (
        "test",
    )

    search_fields = (
        "test__title",
        "question__question_text",
    )

    ordering = (
        "test",
        "order",
    )