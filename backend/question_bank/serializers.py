from rest_framework import serializers

from .models import Question, QuestionOption


class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = [
            "id",
            "option_text",
            "is_correct",
            "order",
        ]
        read_only_fields = ["id"]


class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, required=False)

    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True
    )

    created_by_name = serializers.CharField(
        source="created_by.full_name",
        read_only=True
    )

    class Meta:
        model = Question
        fields = [
            "id",
            "subject",
            "subject_name",
            "question_text",
            "question_type",
            "difficulty",
            "marks",
            "explanation",
            "is_active",
            "created_by",
            "created_by_name",
            "options",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        question_type = attrs.get(
            "question_type",
            getattr(
                self.instance,
                "question_type",
                Question.QuestionType.MCQ
            )
        )

        options = self.initial_data.get("options", [])

        if question_type == Question.QuestionType.MCQ:
            if not options:
                raise serializers.ValidationError({
                    "options": "MCQ must have options."
                })

            if len(options) < 2:
                raise serializers.ValidationError({
                    "options": "MCQ must have at least 2 options."
                })

            correct_count = sum(
                1
                for option in options
                if option.get("is_correct") is True
            )

            if correct_count != 1:
                raise serializers.ValidationError({
                    "options": "MCQ must have exactly one correct option."
                })

        return attrs

    def create(self, validated_data):
        options_data = validated_data.pop("options", [])

        request = self.context.get("request")

        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user

        question = Question.objects.create(**validated_data)

        for index, option_data in enumerate(options_data, start=1):
            QuestionOption.objects.create(
                question=question,
                option_text=option_data["option_text"],
                is_correct=option_data.get("is_correct", False),
                order=option_data.get("order", index),
            )

        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop("options", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if options_data is not None:
            instance.options.all().delete()

            for index, option_data in enumerate(options_data, start=1):
                QuestionOption.objects.create(
                    question=instance,
                    option_text=option_data["option_text"],
                    is_correct=option_data.get("is_correct", False),
                    order=option_data.get("order", index),
                )

        return instance