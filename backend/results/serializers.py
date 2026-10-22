from rest_framework import serializers

from .models import Result


class ResultSerializer(serializers.ModelSerializer):

    test_title = serializers.CharField(
        source="test.title",
        read_only=True
    )

    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True
    )

    class Meta:
        model = Result

        fields = [
            "id",
            "student",
            "student_name",
            "test",
            "test_title",
            "obtained_marks",
            "total_marks",
            "percentage",
            "passing_percentage",
            "status",
            "correct_answers",
            "wrong_answers",
            "unanswered",
            "submitted_at",
        ]

        read_only_fields = fields