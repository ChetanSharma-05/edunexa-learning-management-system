from rest_framework import generics, status
from rest_framework.response import Response

from accounts.permissions import IsAdmin

from .models import TeacherProfile
from .serializers import (
    TeacherSerializer,
    TeacherCreateSerializer,
)


class TeacherListCreateView(
    generics.ListCreateAPIView
):

    permission_classes = [IsAdmin]

    queryset = TeacherProfile.objects.select_related(
        "user"
    ).all().order_by("-created_at")

    def get_serializer_class(self):

        if self.request.method == "POST":
            return TeacherCreateSerializer

        return TeacherSerializer

    def create(
        self,
        request,
        *args,
        **kwargs
    ):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        teacher = serializer.save()

        response_serializer = TeacherSerializer(
            teacher
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class TeacherDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    permission_classes = [IsAdmin]

    queryset = TeacherProfile.objects.select_related(
        "user"
    ).all()

    serializer_class = TeacherSerializer

    http_method_names = [
        "get",
        "put",
        "patch",
        "delete",
        "head",
        "options",
    ]