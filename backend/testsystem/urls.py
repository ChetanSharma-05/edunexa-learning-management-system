from django.urls import path

from .views import (
    AttemptDetailView,
    MyAttemptsView,
    StartTestAttemptView,
    SubmitAnswerView,
    SubmitTestAttemptView,
    StudentAvailableTestsView,
    TestActivateDeactivateView,
    TestDetailView,
    TestListCreateView,
    TestQuestionDetailView,
    TestQuestionListCreateView,
    TestStatusUpdateView,
    TeacherDashboardStatsView,
)


urlpatterns = [
    path(
        "",
        TestListCreateView.as_view(),
        name="test-list-create",
    ),

    path(
        "available/",
        StudentAvailableTestsView.as_view(),
        name="student-available-tests",
    ),

    path(
        "<int:pk>/",
        TestDetailView.as_view(),
        name="test-detail",
    ),

    path(
        "<int:pk>/status/",
        TestStatusUpdateView.as_view(),
        name="test-status-update",
    ),

    path(
        "<int:pk>/toggle-active/",
        TestActivateDeactivateView.as_view(),
        name="test-toggle-active",
    ),

    path(
        "<int:test_id>/questions/",
        TestQuestionListCreateView.as_view(),
        name="test-question-list-create",
    ),

    path(
        "questions/<int:pk>/",
        TestQuestionDetailView.as_view(),
        name="test-question-detail",
    ),

    path(
        "attempts/start/",
        StartTestAttemptView.as_view(),
        name="start-test-attempt",
    ),

    path(
        "attempts/my/",
        MyAttemptsView.as_view(),
        name="my-attempts",
    ),

    path(
        "attempts/<int:attempt_id>/",
        AttemptDetailView.as_view(),
        name="attempt-detail",
    ),

    path(
        "attempts/<int:attempt_id>/answer/",
        SubmitAnswerView.as_view(),
        name="submit-answer",
    ),

    path(
        "attempts/<int:attempt_id>/submit/",
        SubmitTestAttemptView.as_view(),
        name="submit-test-attempt",
    ),


    path(
    "teacher/dashboard/",
    TeacherDashboardStatsView.as_view(),
    name="teacher-dashboard-stats",
),
]