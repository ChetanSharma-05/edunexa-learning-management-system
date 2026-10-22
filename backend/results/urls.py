from django.urls import path

from .views import (
    StudentResultListView,
    StudentResultDetailView,
    TeacherResultListView,
    TeacherResultDetailView,
)

urlpatterns = [
    path(
        "student/",
        StudentResultListView.as_view(),
        name="student-results",
    ),
    path(
        "student/<int:pk>/",
        StudentResultDetailView.as_view(),
        name="student-result-detail",
    ),
    path(
        "teacher/",
        TeacherResultListView.as_view(),
        name="teacher-results",
    ),
    path(
        "teacher/<int:pk>/",
        TeacherResultDetailView.as_view(),
        name="teacher-result-detail",
    ),
]