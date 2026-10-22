from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Test,
    TestQuestion,
    TestAttempt,
    TestAttemptAnswer,
)

from question_bank.models import (
    Question,
    QuestionOption,
)


class TestQuestionInputSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()

    order = serializers.IntegerField(
        min_value=1
    )

    marks = serializers.DecimalField(
        max_digits=7,
        decimal_places=2,
        min_value=0.01
    )

    negative_marks = serializers.DecimalField(
        max_digits=7,
        decimal_places=2,
        min_value=0,
        default=0
    )

    def validate_question_id(self, value):
        if not Question.objects.filter(
            id=value,
            is_active=True
        ).exists():
            raise serializers.ValidationError(
                "Question does not exist or is inactive."
            )

        return value


class TestSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True
    )

    created_by_name = serializers.CharField(
        source="created_by.full_name",
        read_only=True
    )

    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Test

        fields = [
            "id",
            "title",
            "description",
            "subject",
            "subject_name",
            "created_by",
            "created_by_name",
            "duration_minutes",
            "total_marks",
            "passing_marks",
            "start_date",
            "end_date",
            "status",
            "shuffle_questions",
            "show_result_immediately",
            "allow_retake",
            "max_attempts",
            "is_active",
            "question_count",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "created_by",
            "total_marks",
            "question_count",
            "created_at",
            "updated_at",
        ]

    def get_question_count(self, obj):
        return obj.test_questions.count()


class TestQuestionSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(
        source="question.question_text",
        read_only=True
    )

    question_type = serializers.CharField(
        source="question.question_type",
        read_only=True
    )

    difficulty = serializers.CharField(
        source="question.difficulty",
        read_only=True
    )

    class Meta:
        model = TestQuestion

        fields = [
            "id",
            "test",
            "question",
            "question_text",
            "question_type",
            "difficulty",
            "order",
            "marks",
            "negative_marks",
        ]

        read_only_fields = [
            "id",
            "question_text",
            "question_type",
            "difficulty",
        ]


class TestDetailSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True
    )

    created_by_name = serializers.CharField(
        source="created_by.full_name",
        read_only=True
    )

    questions = serializers.SerializerMethodField()

    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Test

        fields = [
            "id",
            "title",
            "description",
            "subject",
            "subject_name",
            "created_by",
            "created_by_name",
            "duration_minutes",
            "total_marks",
            "passing_marks",
            "start_date",
            "end_date",
            "status",
            "shuffle_questions",
            "show_result_immediately",
            "allow_retake",
            "max_attempts",
            "is_active",
            "question_count",
            "questions",
            "created_at",
            "updated_at",
        ]

    def get_question_count(self, obj):
        return obj.test_questions.count()

    def get_questions(self, obj):
        return TestQuestionSerializer(
            obj.test_questions.select_related(
                "question"
            ),
            many=True
        ).data


class TestCreateSerializer(serializers.ModelSerializer):
    questions = TestQuestionInputSerializer(
        many=True,
        required=False
    )

    class Meta:
        model = Test

        fields = [
            "title",
            "description",
            "subject",
            "duration_minutes",
            "passing_marks",
            "start_date",
            "end_date",
            "status",
            "shuffle_questions",
            "show_result_immediately",
            "allow_retake",
            "max_attempts",
            "is_active",
            "questions",
        ]

    def validate_subject(self, value):
        if not value.is_active:
            raise serializers.ValidationError(
                "Selected subject is inactive."
            )

        return value

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if start_date and end_date:
            if end_date <= start_date:
                raise serializers.ValidationError({
                    "end_date":
                        "End date must be after start date."
                })

        duration = attrs.get(
            "duration_minutes",
            30
        )

        if duration <= 0:
            raise serializers.ValidationError({
                "duration_minutes":
                    "Duration must be greater than zero."
            })

        max_attempts = attrs.get(
            "max_attempts",
            1
        )

        if max_attempts < 1:
            raise serializers.ValidationError({
                "max_attempts":
                    "Maximum attempts must be at least 1."
            })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        questions_data = validated_data.pop(
            "questions",
            []
        )

        request = self.context.get("request")

        test = Test.objects.create(
            created_by=request.user,
            **validated_data
        )

        self._create_questions(
            test,
            questions_data
        )

        self._update_total_marks(test)

        return test

    def _create_questions(
        self,
        test,
        questions_data
    ):
        question_ids = [
            item["question_id"]
            for item in questions_data
        ]

        if len(question_ids) != len(set(question_ids)):
            raise serializers.ValidationError(
                "A question cannot be added more than once."
            )

        objects = []

        for item in questions_data:
            objects.append(
                TestQuestion(
                    test=test,
                    question_id=item["question_id"],
                    order=item["order"],
                    marks=item["marks"],
                    negative_marks=item[
                        "negative_marks"
                    ],
                )
            )

        TestQuestion.objects.bulk_create(
            objects
        )

    def _update_total_marks(self, test):
        total = sum(
            item.marks
            for item in test.test_questions.all()
        )

        test.total_marks = total

        test.save(
            update_fields=[
                "total_marks",
                "updated_at",
            ]
        )


class TestUpdateSerializer(serializers.ModelSerializer):
    questions = TestQuestionInputSerializer(
        many=True,
        required=False
    )

    class Meta:
        model = Test

        fields = [
            "title",
            "description",
            "subject",
            "duration_minutes",
            "passing_marks",
            "start_date",
            "end_date",
            "status",
            "shuffle_questions",
            "show_result_immediately",
            "allow_retake",
            "max_attempts",
            "is_active",
            "questions",
        ]

    def validate_subject(self, value):
        if not value.is_active:
            raise serializers.ValidationError(
                "Selected subject is inactive."
            )

        return value

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            getattr(
                self.instance,
                "start_date",
                None
            )
        )

        end_date = attrs.get(
            "end_date",
            getattr(
                self.instance,
                "end_date",
                None
            )
        )

        if start_date and end_date:
            if end_date <= start_date:
                raise serializers.ValidationError({
                    "end_date":
                        "End date must be after start date."
                })

        duration = attrs.get(
            "duration_minutes",
            getattr(
                self.instance,
                "duration_minutes",
                30
            )
        )

        if duration <= 0:
            raise serializers.ValidationError({
                "duration_minutes":
                    "Duration must be greater than zero."
            })

        max_attempts = attrs.get(
            "max_attempts",
            getattr(
                self.instance,
                "max_attempts",
                1
            )
        )

        if max_attempts < 1:
            raise serializers.ValidationError({
                "max_attempts":
                    "Maximum attempts must be at least 1."
            })

        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        questions_data = validated_data.pop(
            "questions",
            None
        )

        for attr, value in validated_data.items():
            setattr(
                instance,
                attr,
                value
            )

        instance.save()

        if questions_data is not None:
            self._replace_questions(
                instance,
                questions_data
            )

        self._update_total_marks(instance)

        return instance

    def _replace_questions(
        self,
        test,
        questions_data
    ):
        question_ids = [
            item["question_id"]
            for item in questions_data
        ]

        if len(question_ids) != len(set(question_ids)):
            raise serializers.ValidationError(
                "A question cannot be added more than once."
            )

        test.test_questions.all().delete()

        objects = []

        for item in questions_data:
            objects.append(
                TestQuestion(
                    test=test,
                    question_id=item["question_id"],
                    order=item["order"],
                    marks=item["marks"],
                    negative_marks=item[
                        "negative_marks"
                    ],
                )
            )

        TestQuestion.objects.bulk_create(
            objects
        )

    def _update_total_marks(self, test):
        total = sum(
            item.marks
            for item in test.test_questions.all()
        )

        test.total_marks = total

        test.save(
            update_fields=[
                "total_marks",
                "updated_at",
            ]
        )


class TestStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=Test.Status.choices
    )


class AttemptQuestionSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="question.id")
    question_text = serializers.CharField(source="question.question_text")
    question_type = serializers.CharField(source="question.question_type")
    difficulty = serializers.CharField(source="question.difficulty")
    order = serializers.IntegerField()
    marks = serializers.DecimalField(max_digits=7, decimal_places=2)
    negative_marks = serializers.DecimalField(max_digits=7, decimal_places=2)
    options = serializers.SerializerMethodField()

    def get_options(self, obj):
        options = QuestionOption.objects.filter(
            question=obj.question
        ).order_by("order").values(
            "id",
            "option_text",
        )

        return list(options)


class TestAttemptSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(
        source="test.title",
        read_only=True
    )

    subject_name = serializers.CharField(
        source="test.subject.name",
        read_only=True
    )

    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True
    )

    remaining_seconds = serializers.SerializerMethodField()

    class Meta:
        model = TestAttempt

        fields = [
            "id",
            "test",
            "test_title",
            "subject_name",
            "student",
            "student_name",
            "attempt_number",
            "status",
            "started_at",
            "submitted_at",
            "score",
            "total_marks",
            "percentage",
            "is_passed",
            "remaining_seconds",
        ]

        read_only_fields = [
            "id",
            "student",
            "attempt_number",
            "status",
            "started_at",
            "submitted_at",
            "score",
            "total_marks",
            "percentage",
            "is_passed",
            "remaining_seconds",
        ]

    def get_remaining_seconds(self, obj):
        if obj.status != TestAttempt.Status.IN_PROGRESS:
            return 0

        elapsed = (
            timezone.now() -
            obj.started_at
        ).total_seconds()

        duration = (
            obj.test.duration_minutes * 60
        )

        return max(
            0,
            int(duration - elapsed)
        )


class StartAttemptSerializer(serializers.Serializer):
    test_id = serializers.IntegerField()

    def validate_test_id(self, value):
        try:
            Test.objects.get(
                id=value,
                is_active=True,
                status=Test.Status.PUBLISHED
            )
        except Test.DoesNotExist:
            raise serializers.ValidationError(
                "Test is not available."
            )

        return value


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()

    selected_option_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    written_answer = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )

    def validate_selected_option_id(self, value):
        if value is None:
            return value

        if not QuestionOption.objects.filter(id=value).exists():
            raise serializers.ValidationError(
                "Selected option does not exist."
            )

        return value


class SubmitAttemptSerializer(serializers.Serializer):
    answers = SubmitAnswerSerializer(
        many=True,
        required=False
    )