
import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .gmail_service import send_password_reset_email
from .serializers import LoginSerializer


logger = logging.getLogger(__name__)
User = get_user_model()
token_generator = PasswordResetTokenGenerator()


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class PasswordResetRequestThrottle(AnonRateThrottle):
    rate = "5/hour"


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        min_length=8,
    )
    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        try:
            validate_password(attrs["new_password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({
                "new_password": list(exc.messages)
            })

        return attrs


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [PasswordResetRequestThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].strip()

        users = User.objects.filter(
            email__iexact=email,
            is_active=True,
        )

        if users.count() == 1:
            user = users.first()

            try:
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = token_generator.make_token(user)

                frontend_url = settings.FRONTEND_URL.rstrip("/")
                reset_url = (
                    f"{frontend_url}/reset-password/{uid}/{token}"
                )

                message = (
                    f"Hello {user.get_username()},\n\n"
                    "We received a request to reset your EduNexa password.\n\n"
                    f"Open this link to reset your password:\n{reset_url}\n\n"
                    "This link expires after one hour.\n"
                    "If you did not request this, you can ignore this email."
                )

                send_password_reset_email(
                    to_email=user.email,
                    subject="Reset your EduNexa password",
                    message=message,
                )

            except Exception:
                logger.exception(
                    "Password reset email could not be sent."
                )
                return Response(
                    {
                        "detail": (
                            "Unable to send the reset email right now. "
                            "Please try again later."
                        )
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        return Response(
            {
                "detail": (
                    "If an account exists with this email, "
                    "a password reset link has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(
                pk=user_id,
                is_active=True,
            )
        except (
            ValueError,
            TypeError,
            OverflowError,
            User.DoesNotExist,
        ):
            return Response(
                {
                    "detail": (
                        "This password reset link is invalid or expired."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not token_generator.check_token(user, token):
            return Response(
                {
                    "detail": (
                        "This password reset link is invalid or expired."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response(
            {
                "detail": (
                    "Password reset successful. You can now sign in."
                )
            },
            status=status.HTTP_200_OK,
        )
