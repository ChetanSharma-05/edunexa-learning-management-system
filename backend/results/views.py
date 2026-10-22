from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Result
from .serializers import ResultSerializer


class StudentResultListView(generics.ListAPIView):
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role != "STUDENT":
            return Result.objects.none()

        return (
            Result.objects.filter(student=user)
            .select_related("student", "test", "test__created_by")
            .order_by("-submitted_at")
        )


class StudentResultDetailView(generics.RetrieveAPIView):
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role != "STUDENT":
            return Result.objects.none()

        return (
            Result.objects.filter(student=user)
            .select_related("student", "test", "test__created_by")
        )


class TeacherResultListView(generics.ListAPIView):
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role != "TEACHER":
            return Result.objects.none()

        queryset = (
            Result.objects.filter(test__created_by=user)
            .select_related("student", "test", "test__subject")
            .order_by("-submitted_at")
        )

        search = self.request.query_params.get("search", "").strip()
        status = self.request.query_params.get("status", "").upper()
        test_id = self.request.query_params.get("test", "").strip()

        if search:
            queryset = queryset.filter(
                Q(student__full_name__icontains=search)
                | Q(student__username__icontains=search)
                | Q(test__title__icontains=search)
            )

        if status in ["PASS", "FAIL"]:
            queryset = queryset.filter(status=status)

        if test_id.isdigit():
            queryset = queryset.filter(test_id=int(test_id))

        return queryset


class TeacherResultDetailView(generics.RetrieveAPIView):
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role != "TEACHER":
            return Result.objects.none()

        return (
            Result.objects.filter(test__created_by=user)
            .select_related("student", "test", "test__subject")
        )