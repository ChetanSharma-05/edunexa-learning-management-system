from django.db import transaction
from rest_framework import serializers

from accounts.models import User
from .models import StudentProfile


class StudentSerializer(
    serializers.ModelSerializer
):

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
        model = StudentProfile

        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "admission_id",
            "roll_number",
            "phone",
            "course",
            "class_name",
            "date_of_birth",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def update(
        self,
        instance,
        validated_data
    ):

        user_data = validated_data.pop(
            "user",
            {}
        )

        user = instance.user

        if "username" in user_data:
            user.username = user_data[
                "username"
            ]

        if "email" in user_data:
            user.email = user_data[
                "email"
            ]

        if "full_name" in user_data:
            user.full_name = user_data[
                "full_name"
            ]

        if "is_active" in user_data:
            user.is_active = user_data[
                "is_active"
            ]

        user.save()

        for field, value in validated_data.items():
            setattr(
                instance,
                field,
                value
            )

        instance.save()

        return instance


class StudentCreateSerializer(
    serializers.Serializer
):

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

    admission_id = serializers.CharField(
        max_length=50
    )

    roll_number = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True
    )

    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True
    )

    course = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True
    )

    class_name = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )

    date_of_birth = serializers.DateField(
        required=False,
        allow_null=True
    )

    def validate_username(
        self,
        value
    ):

        if User.objects.filter(
            username=value
        ).exists():

            raise serializers.ValidationError(
                "Username already exists."
            )

        return value

    def validate_admission_id(
        self,
        value
    ):

        if StudentProfile.objects.filter(
            admission_id=value
        ).exists():

            raise serializers.ValidationError(
                "Admission ID already exists."
            )

        return value

    @transaction.atomic
    def create(
        self,
        validated_data
    ):

        request = self.context[
            "request"
        ]

        user = User.objects.create_user(
            username=validated_data[
                "username"
            ],
            password=validated_data[
                "password"
            ],
            full_name=validated_data[
                "full_name"
            ],
            email=validated_data[
                "email"
            ],
            role=User.Role.STUDENT,
            is_active=True,
        )

        student = StudentProfile.objects.create(
            user=user,
            admission_id=validated_data[
                "admission_id"
            ],
            roll_number=validated_data.get(
                "roll_number",
                ""
            ),
            phone=validated_data.get(
                "phone",
                ""
            ),
            course=validated_data.get(
                "course",
                ""
            ),
            class_name=validated_data.get(
                "class_name",
                ""
            ),
            date_of_birth=validated_data.get(
                "date_of_birth"
            ),
            created_by=request.user,
        )

        return student