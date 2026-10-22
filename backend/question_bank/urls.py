from django.urls import path

from .views import QuestionListCreateView, QuestionDetailView
from .ai_pdf_views import AIPDFPreviewView, AIPDFSaveQuestionsView
from .ai_options_views import GenerateIncorrectOptionsView

urlpatterns = [
    path("", QuestionListCreateView.as_view(), name="question-list-create"),
    path("<int:pk>/", QuestionDetailView.as_view(), name="question-detail"),

    path(
        "ai-pdf/preview/",
        AIPDFPreviewView.as_view(),
        name="ai-pdf-preview",
    ),
    path(
        "ai-pdf/save/",
        AIPDFSaveQuestionsView.as_view(),
        name="ai-pdf-save",
    ),
    
    path(
        "generate-options/",
        GenerateIncorrectOptionsView.as_view(),
        name="generate-incorrect-options",
    ),
]