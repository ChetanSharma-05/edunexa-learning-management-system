from rest_framework import generics, status
from rest_framework.response import Response

from accounts.permissions import (
    IsAdminOrTeacher,
)

from .models import StudentProfile
from .serializers import (
    StudentSerializer,
    StudentCreateSerializer,
)


class StudentListCreateView(
    generics.ListCreateAPIView
):

    permission_classes = [
        IsAdminOrTeacher
    ]

    queryset = (
        StudentProfile.objects
        .select_related("user")
        .all()
        .order_by("-created_at")
    )

    def get_serializer_class(self):

        if self.request.method == "POST":
            return StudentCreateSerializer

        return StudentSerializer

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

        student = serializer.save()

        response_serializer = (
            StudentSerializer(
                student
            )
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class StudentDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    permission_classes = [
        IsAdminOrTeacher
    ]

    queryset = (
        StudentProfile.objects
        .select_related("user")
        .all()
    )

    serializer_class = StudentSerializer