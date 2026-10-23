from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/", include("accounts.urls")),

    path("api/admin/teachers/", include("teachers.urls")),

    path("api/students/", include("students.urls")),

    path("api/admin/subjects/", include("subjects.urls")),

    path("api/question-bank/", include("question_bank.urls")),

    path("api/testsystem/", include("testsystem.urls")),

    path("api/notes/", include("notes.urls")),

    path("api/results/", include("results.urls")),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )