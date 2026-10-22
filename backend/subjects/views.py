
from django.db.models import Q

from rest_framework import generics
from rest_framework.permissions import BasePermission

from accounts.permissions import IsAdmin
from testsystem.permissions import IsAdminOrTeacher

from .models import Subject
from .serializers import (
    SubjectSerializer,
    SubjectCreateSerializer,
)


class IsStudent(BasePermission):

    def has_permission(self, request, view):

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "STUDENT"
        )


class SubjectListCreateView(
    generics.ListCreateAPIView
):

    permission_classes = [
        IsAdminOrTeacher
    ]

    queryset = Subject.objects.all().order_by(
        "-created_at"
    )

    def get_serializer_class(self):

        if self.request.method == "POST":
            return SubjectCreateSerializer

        return SubjectSerializer


class SubjectDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    permission_classes = [
        IsAdminOrTeacher
    ]

    queryset = Subject.objects.all()

    serializer_class = SubjectSerializer


class StudentSubjectListView(
    generics.ListAPIView
):

    permission_classes = [
        IsStudent
    ]

    serializer_class = SubjectSerializer

    def get_queryset(self):

        queryset = Subject.objects.filter(
            is_active=True
        ).order_by(
            "name"
        )

        search = self.request.query_params.get(
            "search",
            ""
        ).strip()

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                |
                Q(code__icontains=search)
                |
                Q(description__icontains=search)
            )

        return queryset
