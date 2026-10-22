from rest_framework import serializers

from .models import Subject


class SubjectSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = Subject

        fields = [
            "id",
            "name",
            "code",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class SubjectCreateSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = Subject

        fields = [
            "name",
            "code",
            "description",
        ]

    def validate_code(self, value):

        value = value.upper().strip()

        if Subject.objects.filter(
            code=value
        ).exists():

            raise serializers.ValidationError(
                "Subject code already exists."
            )

        return value

    def create(self, validated_data):

        request = self.context["request"]

        return Subject.objects.create(
            **validated_data,
            created_by=request.user
        )