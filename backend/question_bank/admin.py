from django.contrib import admin

from .models import Question, QuestionOption


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 0


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "question_text",
        "subject",
        "question_type",
        "difficulty",
        "marks",
        "is_active",
        "created_by",
        "created_at",
    )

    list_filter = (
        "question_type",
        "difficulty",
        "is_active",
        "subject",
    )

    search_fields = (
        "question_text",
        "subject__name",
    )

    inlines = [
        QuestionOptionInline
    ]


@admin.register(QuestionOption)
class QuestionOptionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "question",
        "option_text",
        "is_correct",
        "order",
    )

    list_filter = (
        "is_correct",
    )