from django.db import transaction
from rest_framework import serializers

from accounts.models import User
from .models import TeacherProfile


class TeacherSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username"
    )

    email = serializers.EmailField(
        source="user.email",
        required=False,
        allow_blank=True
    )

    full_name = serializers.CharField(
        source="user.full_name"
    )

    is_active = serializers.BooleanField(
        source="user.is_active"
    )

    class Meta:
        model = TeacherProfile

        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "employee_id",
            "phone",
            "qualification",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    @transaction.atomic
    def update(self, instance, validated_data):

        user_data = validated_data.pop("user", {})

        user = instance.user

        if "username" in user_data:
            username = user_data["username"]

            if User.objects.exclude(
                pk=user.pk
            ).filter(
                username=username
            ).exists():
                raise serializers.ValidationError({
                    "username": "Username already exists."
                })

            user.username = username

        if "email" in user_data:
            user.email = user_data["email"]

        if "full_name" in user_data:
            user.full_name = user_data["full_name"]

        if "is_active" in user_data:
            user.is_active = user_data["is_active"]

        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        return instance


class TeacherCreateSerializer(serializers.Serializer):

    username = serializers.CharField(
        max_length=150
    )

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    full_name = serializers.CharField(
        max_length=150
    )

    email = serializers.EmailField(
        required=True
    )

    employee_id = serializers.CharField(
        max_length=50
    )

    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True
    )

    qualification = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True
    )

    def validate_username(self, value):

        if User.objects.filter(
            username=value
        ).exists():

            raise serializers.ValidationError(
                "Username already exists."
            )

        return value

    def validate_employee_id(self, value):

        if TeacherProfile.objects.filter(
            employee_id=value
        ).exists():

            raise serializers.ValidationError(
                "Employee ID already exists."
            )

        return value

    @transaction.atomic
    def create(self, validated_data):

        request = self.context["request"]

        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            full_name=validated_data["full_name"],
            email=validated_data["email"],
            role=User.Role.TEACHER,
            is_active=True,
        )

        teacher = TeacherProfile.objects.create(
            user=user,
            employee_id=validated_data["employee_id"],
            phone=validated_data.get(
                "phone",
                ""
            ),
            qualification=validated_data.get(
                "qualification",
                ""
            ),
            created_by=request.user,
        )

        return teacher