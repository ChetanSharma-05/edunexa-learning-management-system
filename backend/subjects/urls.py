from django.urls import path

from .views import (
    SubjectListCreateView,
    SubjectDetailView,
    StudentSubjectListView,
)


urlpatterns = [

    path(
        "",
        SubjectListCreateView.as_view(),
        name="subject-list-create"
    ),

    path(
        "student/",
        StudentSubjectListView.as_view(),
        name="student-subject-list"
    ),

    path(
        "<int:pk>/",
        SubjectDetailView.as_view(),
        name="subject-detail"
    ),
]