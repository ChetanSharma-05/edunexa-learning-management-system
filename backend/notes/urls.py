from django.urls import path

from .views import (
    AdminTeacherNoteListCreateView,
    AdminTeacherNoteDetailView,
    StudentNoteListView,
)


urlpatterns = [

    path(
        "",
        AdminTeacherNoteListCreateView.as_view(),
        name="note-list-create"
    ),

    path(
        "<int:pk>/",
        AdminTeacherNoteDetailView.as_view(),
        name="note-detail"
    ),

    path(
        "student/",
        StudentNoteListView.as_view(),
        name="student-note-list"
    ),
]