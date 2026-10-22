from html import escape

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.db.models import Q

from rest_framework import generics
from rest_framework.permissions import BasePermission

from .models import Note
from .serializers import NoteSerializer


def send_note_published_notification(note_id, request=None):
    """
    Email active students when a note is uploaded.
    """
    try:
        note = Note.objects.select_related("subject", "created_by").get(
            id=note_id,
            is_active=True,
        )
        User = get_user_model()
        students = (
            User.objects.filter(role="STUDENT", is_active=True)
            .exclude(email__isnull=True)
            .exclude(email="")
            .distinct()
        )

        frontend_url = getattr(
            settings, "FRONTEND_URL", "http://localhost:5173"
        ).rstrip("/")
        note_url = ""
        if note.file:
            try:
                file_url = note.file.url
                if request is not None:
                    note_url = request.build_absolute_uri(file_url)
                elif file_url.startswith(("http://", "https://")):
                    note_url = file_url
                else:
                    note_url = f"{frontend_url}{file_url}"
            except (ValueError, AttributeError):
                note_url = ""

        note_title = escape(str(note.title))
        subject_name = escape(str(note.subject.name))
        description = escape(str(note.description or "No description provided."))
        safe_note_url = escape(note_url, quote=True)

        email_subject = f"New Notes Uploaded: {note.title}"
        plain_message = (
            f"New notes have been uploaded on EduNexa.\\n\\n"
            f"Title: {note.title}\\n"
            f"Subject: {note.subject.name}\\n"
            f"Description: {note.description or 'No description provided.'}\\n"
            + (f"Download Notes: {note_url}" if note_url else
               "The notes download link is not available. Please open EduNexa.")
        )

        download_button = (
            f'<p><a href="{safe_note_url}" '
            'style="display:inline-block;padding:12px 22px;'
            'background:#4f46e5;color:#ffffff;text-decoration:none;'
            'border-radius:8px">Download Notes</a></p>'
            if safe_note_url
            else '<p>Please open EduNexa to access the notes.</p>'
        )
        html_message = f"""<!doctype html>
<html>
<body style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6">
  <h2>New Notes Uploaded - EduNexa</h2>
  <p>New study material is available for you.</p>
  <p><strong>Title:</strong> {note_title}</p>
  <p><strong>Subject:</strong> {subject_name}</p>
  <p><strong>Description:</strong> {description}</p>
  {download_button}
</body>
</html>"""

        for student in students.iterator():
            try:
                email = EmailMultiAlternatives(
                    subject=email_subject,
                    body=plain_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[student.email],
                )
                email.attach_alternative(html_message, "text/html")
                email.send(fail_silently=True)
            except Exception:
                continue
    except Exception:
        # Notification failures must not interrupt note creation.
        return



class IsAdminOrTeacher(BasePermission):

    def has_permission(
        self,
        request,
        view
    ):

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                "ADMIN",
                "TEACHER",
            ]
        )


class IsStudent(BasePermission):

    def has_permission(
        self,
        request,
        view
    ):

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "STUDENT"
        )


class AdminTeacherNoteListCreateView(
    generics.ListCreateAPIView
):

    permission_classes = [
        IsAdminOrTeacher
    ]

    serializer_class = NoteSerializer

    def get_queryset(self):

        queryset = Note.objects.select_related(
            "subject",
            "created_by"
        ).all().order_by(
            "-created_at"
        )

        search = self.request.query_params.get(
            "search",
            ""
        ).strip()

        subject = self.request.query_params.get(
            "subject"
        )

        if search:

            queryset = queryset.filter(
                Q(title__icontains=search)
                |
                Q(description__icontains=search)
                |
                Q(subject__name__icontains=search)
                |
                Q(subject__code__icontains=search)
            )

        if subject:

            queryset = queryset.filter(
                subject_id=subject
            )

        return queryset

    def perform_create(self, serializer):
        note = serializer.save(created_by=self.request.user)
        if note.is_active:
            transaction.on_commit(
                lambda note_id=note.id, request=self.request:
                    send_note_published_notification(note_id, request)
            )


class AdminTeacherNoteDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    permission_classes = [
        IsAdminOrTeacher
    ]

    serializer_class = NoteSerializer

    queryset = Note.objects.select_related(
        "subject",
        "created_by"
    )


class StudentNoteListView(
    generics.ListAPIView
):

    permission_classes = [
        IsStudent
    ]

    serializer_class = NoteSerializer

    def get_queryset(self):

        queryset = Note.objects.select_related(
            "subject",
            "created_by"
        ).filter(
            is_active=True
        ).order_by(
            "-created_at"
        )

        search = self.request.query_params.get(
            "search",
            ""
        ).strip()

        subject = self.request.query_params.get(
            "subject"
        )

        if search:

            queryset = queryset.filter(
                Q(title__icontains=search)
                |
                Q(description__icontains=search)
                |
                Q(subject__name__icontains=search)
                |
                Q(subject__code__icontains=search)
            )

        if subject:

            queryset = queryset.filter(
                subject_id=subject
            )

        return queryset