import random
from html import escape
from decimal import Decimal



from django.conf import settings
from django.db import transaction

from django.db.models import Avg, Count, Q

from django.utils import timezone



from rest_framework import status

from rest_framework.response import Response

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated



from question_bank.models import QuestionOption

from results.models import Result
from notifications.email_utils import send_student_email_notifications



from .models import (

    Test,

    TestQuestion,

    TestAttempt,

    TestAttemptAnswer,

)



from .permissions import (

    IsAdminOrTeacher,

    IsAdminOrTeacherOrStudent,

)



from .serializers import (

    AttemptQuestionSerializer,

    StartAttemptSerializer,

    SubmitAnswerSerializer,

    SubmitAttemptSerializer,

    TestAttemptSerializer,

    TestCreateSerializer,

    TestDetailSerializer,

    TestQuestionSerializer,

    TestSerializer,

    TestStatusSerializer,

    TestUpdateSerializer,

)





def send_test_published_notification(test_id):
    try:
        test = Test.objects.select_related("subject").get(
            id=test_id,
            is_active=True,
            status=Test.Status.PUBLISHED,
        )
        frontend_url = getattr(
            settings, "FRONTEND_URL", "http://localhost:5173"
        ).rstrip("/")
        take_test_url = f"{frontend_url}/student/test/{test.id}"

        start_date = (
            timezone.localtime(test.start_date).strftime("%d %b %Y, %I:%M %p")
            if test.start_date
            else "Not specified"
        )
        end_date = (
            timezone.localtime(test.end_date).strftime("%d %b %Y, %I:%M %p")
            if test.end_date
            else "Not specified"
        )

        test_title = escape(str(test.title))
        subject_name = escape(str(test.subject.name))
        safe_start_date = escape(start_date)
        safe_end_date = escape(end_date)
        safe_url = escape(take_test_url, quote=True)

        email_subject = f"New Test Published: {test.title}"
        plain_message = (
            f"A new test has been published on EduNexa.\\n\\n"
            f"Test: {test.title}\\n"
            f"Subject: {test.subject.name}\\n"
            f"Start: {start_date}\\n"
            f"End: {end_date}\\n\\n"
            f"Take Test: {take_test_url}"
        )
        html_message = f"""<!doctype html>
<html>
<body style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6">
  <h2>New Test Published - EduNexa</h2>
  <p>A new test is available for you.</p>
  <p><strong>Test:</strong> {test_title}</p>
  <p><strong>Subject:</strong> {subject_name}</p>
  <p><strong>Start:</strong> {safe_start_date}</p>
  <p><strong>End:</strong> {safe_end_date}</p>
  <p><a href="{safe_url}" style="display:inline-block;padding:12px 22px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px">Take Test</a></p>
</body>
</html>"""
        send_student_email_notifications(
            email_subject, plain_message, html_message
        )
    except Exception:
        # Email failures should not break test creation or publishing.
        return


def schedule_test_published_notification(test_id):
    transaction.on_commit(
        lambda published_test_id=test_id:
            send_test_published_notification(published_test_id)
    )



class TestListCreateView(APIView):

    permission_classes = [

        IsAdminOrTeacher

    ]



    def get(self, request):

        queryset = Test.objects.select_related(

            "subject",

            "created_by",

        ).prefetch_related(

            "test_questions"

        )



        if request.user.role == "TEACHER":

            queryset = queryset.filter(

                created_by=request.user

            )



        search = request.query_params.get(

            "search",

            ""

        ).strip()



        subject = request.query_params.get(

            "subject"

        )



        test_status = request.query_params.get(

            "status"

        )



        is_active = request.query_params.get(

            "is_active"

        )



        if search:

            queryset = queryset.filter(

                Q(title__icontains=search)

                | Q(description__icontains=search)

                | Q(subject__name__icontains=search)

            )



        if subject:

            queryset = queryset.filter(

                subject_id=subject

            )



        if test_status:

            queryset = queryset.filter(

                status=test_status

            )



        if is_active in [

            "true",

            "false",

        ]:

            queryset = queryset.filter(

                is_active=is_active == "true"

            )



        serializer = TestSerializer(

            queryset,

            many=True

        )



        return Response(

            serializer.data,

            status=status.HTTP_200_OK

        )



    def post(self, request):

        serializer = TestCreateSerializer(

            data=request.data,

            context={

                "request": request

            }

        )



        serializer.is_valid(

            raise_exception=True

        )



        test = serializer.save()

        if test.status == Test.Status.PUBLISHED and test.is_active:
            schedule_test_published_notification(test.id)



        return Response(

            TestDetailSerializer(

                test

            ).data,

            status=status.HTTP_201_CREATED

        )





class TestDetailView(APIView):

    permission_classes = [

        IsAdminOrTeacherOrStudent

    ]



    def get_object(self, request, pk):

        try:

            test = Test.objects.select_related(

                "subject",

                "created_by",

            ).prefetch_related(

                "test_questions__question"

            ).get(pk=pk)

        except Test.DoesNotExist:

            return None



        if (

            request.user.role == "TEACHER"

            and test.created_by_id != request.user.id

        ):

            return None



        return test



    def get(self, request, pk):

        test = self.get_object(

            request,

            pk

        )



        if test is None:

            return Response(

                {

                    "detail":

                        "Test not found or you do not have permission."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        return Response(

            TestDetailSerializer(test).data,

            status=status.HTTP_200_OK

        )



    def put(self, request, pk):

        return self.update_test(

            request,

            pk,

            partial=False

        )



    def patch(self, request, pk):

        return self.update_test(

            request,

            pk,

            partial=True

        )



    def update_test(

        self,

        request,

        pk,

        partial=False

    ):

        if request.user.role not in [

            "ADMIN",

            "TEACHER",

        ]:

            return Response(

                {

                    "detail":

                        "Only admin or teacher can update tests."

                },

                status=status.HTTP_403_FORBIDDEN

            )



        test = self.get_object(

            request,

            pk

        )



        if test is None:

            return Response(

                {

                    "detail":

                        "Test not found or you do not have permission."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        serializer = TestUpdateSerializer(

            test,

            data=request.data,

            partial=partial,

            context={

                "request": request

            }

        )



        serializer.is_valid(

            raise_exception=True

        )



        previous_status = test.status
        updated_test = serializer.save()
        if (
            previous_status != Test.Status.PUBLISHED
            and updated_test.status == Test.Status.PUBLISHED
            and updated_test.is_active
        ):
            schedule_test_published_notification(updated_test.id)



        return Response(

            TestDetailSerializer(

                updated_test

            ).data,

            status=status.HTTP_200_OK

        )



    def delete(self, request, pk):

        if request.user.role != "ADMIN":

            return Response(

                {

                    "detail":

                        "Only admin can delete tests."

                },

                status=status.HTTP_403_FORBIDDEN

            )



        try:

            test = Test.objects.get(pk=pk)

        except Test.DoesNotExist:

            return Response(

                {

                    "detail":

                        "Test not found."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        test.delete()



        return Response(

            {

                "message":

                    "Test deleted successfully."

            },

            status=status.HTTP_200_OK

        )





class TestStatusUpdateView(APIView):

    permission_classes = [

        IsAdminOrTeacher

    ]



    def patch(self, request, pk):

        try:

            test = Test.objects.get(pk=pk)

        except Test.DoesNotExist:

            return Response(

                {

                    "detail":

                        "Test not found."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        if (

            request.user.role == "TEACHER"

            and test.created_by_id != request.user.id

        ):

            return Response(

                {

                    "detail":

                        "You can only update your own tests."

                },

                status=status.HTTP_403_FORBIDDEN

            )



        serializer = TestStatusSerializer(

            data=request.data

        )



        serializer.is_valid(

            raise_exception=True

        )



        previous_status = test.status
        test.status = serializer.validated_data[

            "status"

        ]



        test.save(

            update_fields=[

                "status",

                "updated_at",

            ]

        )

        if (
            previous_status != Test.Status.PUBLISHED
            and test.status == Test.Status.PUBLISHED
            and test.is_active
        ):
            schedule_test_published_notification(test.id)



        return Response(

            TestSerializer(test).data,

            status=status.HTTP_200_OK

        )





class TestActivateDeactivateView(APIView):

    permission_classes = [

        IsAdminOrTeacher

    ]



    def patch(self, request, pk):

        try:

            test = Test.objects.get(pk=pk)

        except Test.DoesNotExist:

            return Response(

                {

                    "detail":

                        "Test not found."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        if (

            request.user.role == "TEACHER"

            and test.created_by_id != request.user.id

        ):

            return Response(

                {

                    "detail":

                        "You can only update your own tests."

                },

                status=status.HTTP_403_FORBIDDEN

            )



        test.is_active = not test.is_active



        test.save(

            update_fields=[

                "is_active",

                "updated_at",

            ]

        )



        return Response(

            {

                "message":

                    "Test activated successfully."

                    if test.is_active

                    else

                    "Test deactivated successfully.",

                "is_active":

                    test.is_active,

            },

            status=status.HTTP_200_OK

        )





class TestQuestionListCreateView(APIView):

    permission_classes = [

        IsAdminOrTeacher

    ]



    def get_test(self, request, test_id):

        try:

            test = Test.objects.get(

                pk=test_id

            )

        except Test.DoesNotExist:

            return None



        if (

            request.user.role == "TEACHER"

            and test.created_by_id != request.user.id

        ):

            return None



        return test



    def get(self, request, test_id):

        test = self.get_test(

            request,

            test_id

        )



        if test is None:

            return Response(

                {

                    "detail":

                        "Test not found or you do not have permission."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        questions = TestQuestion.objects.filter(

            test=test

        ).select_related(

            "question"

        )



        return Response(

            TestQuestionSerializer(

                questions,

                many=True

            ).data,

            status=status.HTTP_200_OK

        )



    def post(self, request, test_id):

        test = self.get_test(

            request,

            test_id

        )



        if test is None:

            return Response(

                {

                    "detail":

                        "Test not found or you do not have permission."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        data = {

            **request.data,

            "test": test.id,

        }



        serializer = TestQuestionSerializer(

            data=data

        )



        serializer.is_valid(

            raise_exception=True

        )



        question = serializer.validated_data[

            "question"

        ]



        if TestQuestion.objects.filter(

            test=test,

            question=question

        ).exists():

            return Response(

                {

                    "detail":

                        "This question is already added to the test."

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        test_question = serializer.save(

            test=test

        )



        self.update_total_marks(test)



        return Response(

            TestQuestionSerializer(

                test_question

            ).data,

            status=status.HTTP_201_CREATED

        )



    def update_total_marks(self, test):

        total = sum(

            item.marks

            for item in test.test_questions.all()

        )



        test.total_marks = total



        test.save(

            update_fields=[

                "total_marks",

                "updated_at",

            ]

        )





class TestQuestionDetailView(APIView):

    permission_classes = [

        IsAdminOrTeacher

    ]



    def get_test_question(

        self,

        request,

        pk

    ):

        try:

            test_question = TestQuestion.objects.select_related(

                "test",

                "question",

            ).get(pk=pk)

        except TestQuestion.DoesNotExist:

            return None



        if (

            request.user.role == "TEACHER"

            and test_question.test.created_by_id

            != request.user.id

        ):

            return None



        return test_question



    def patch(self, request, pk):

        test_question = self.get_test_question(

            request,

            pk

        )



        if test_question is None:

            return Response(

                {

                    "detail":

                        "Test question not found or you do not have permission."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        serializer = TestQuestionSerializer(

            test_question,

            data=request.data,

            partial=True

        )



        serializer.is_valid(

            raise_exception=True

        )



        updated_question = serializer.save()



        self.update_total_marks(

            updated_question.test

        )



        return Response(

            TestQuestionSerializer(

                updated_question

            ).data,

            status=status.HTTP_200_OK

        )



    def delete(self, request, pk):

        test_question = self.get_test_question(

            request,

            pk

        )



        if test_question is None:

            return Response(

                {

                    "detail":

                        "Test question not found or you do not have permission."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        test = test_question.test



        test_question.delete()



        self.update_total_marks(test)



        return Response(

            {

                "message":

                    "Question removed from test successfully."

            },

            status=status.HTTP_200_OK

        )



    def update_total_marks(self, test):

        total = sum(

            item.marks

            for item in test.test_questions.all()

        )



        test.total_marks = total



        test.save(

            update_fields=[

                "total_marks",

                "updated_at",

            ]

        )





class StudentAvailableTestsView(APIView):

    permission_classes = [

        IsAdminOrTeacherOrStudent

    ]



    def get(self, request):

        if request.user.role != "STUDENT":

            return Response(

                {

                    "detail":

                        "Only students can access available tests."

                },

                status=status.HTTP_403_FORBIDDEN

            )



        queryset = Test.objects.filter(

            is_active=True,

            status=Test.Status.PUBLISHED,

        ).select_related(

            "subject",

            "created_by",

        ).prefetch_related(

            "test_questions"

        )



        search = request.query_params.get(

            "search",

            ""

        ).strip()



        subject = request.query_params.get(

            "subject"

        )



        if search:

            queryset = queryset.filter(

                Q(title__icontains=search)

                | Q(subject__name__icontains=search)

            )



        if subject:

            queryset = queryset.filter(

                subject_id=subject

            )



        now = timezone.now()



        queryset = queryset.filter(

            Q(start_date__isnull=True)

            | Q(start_date__lte=now)

        ).filter(

            Q(end_date__isnull=True)

            | Q(end_date__gte=now)

        )



        return Response(

            TestSerializer(

                queryset,

                many=True

            ).data,

            status=status.HTTP_200_OK

        )





class StartTestAttemptView(APIView):

    permission_classes = [

        IsAdminOrTeacherOrStudent

    ]



    def post(self, request):

        if request.user.role != "STUDENT":

            return Response(

                {

                    "detail":

                        "Only students can start tests."

                },

                status=status.HTTP_403_FORBIDDEN

            )



        serializer = StartAttemptSerializer(

            data=request.data

        )



        serializer.is_valid(

            raise_exception=True

        )



        test_id = serializer.validated_data[

            "test_id"

        ]



        try:

            test = Test.objects.select_related(

                "subject"

            ).prefetch_related(

                "test_questions__question"

            ).get(

                id=test_id,

                is_active=True,

                status=Test.Status.PUBLISHED

            )

        except Test.DoesNotExist:

            return Response(

                {

                    "detail":

                        "Test is not available."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        now = timezone.now()



        if (

            test.start_date

            and now < test.start_date

        ):

            return Response(

                {

                    "detail":

                        "Test has not started yet."

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        if (

            test.end_date

            and now > test.end_date

        ):

            return Response(

                {

                    "detail":

                        "Test has already ended."

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        attempts = TestAttempt.objects.filter(

            test=test,

            student=request.user

        )



        active_attempt = attempts.filter(

            status=TestAttempt.Status.IN_PROGRESS

        ).first()



        if active_attempt:

            return self.get_attempt_response(

                active_attempt,

                test

            )



        attempt_count = attempts.count()



        if (

            not test.allow_retake

            and attempt_count >= 1

        ):

            return Response(

                {

                    "detail":

                        "You have already attempted this test."

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        if (

            test.allow_retake

            and attempt_count >= test.max_attempts

        ):

            return Response(

                {

                    "detail":

                        "Maximum attempt limit reached."

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        attempt = TestAttempt.objects.create(

            test=test,

            student=request.user,

            attempt_number=attempt_count + 1,

            total_marks=test.total_marks

        )



        return self.get_attempt_response(

            attempt,

            test

        )



    def get_attempt_response(

        self,

        attempt,

        test

    ):

        questions = list(

            test.test_questions.select_related(

                "question"

            ).all()

        )



        if test.shuffle_questions:

            random.shuffle(questions)



        return Response(

            {

                "attempt":

                    TestAttemptSerializer(

                        attempt

                    ).data,

                "questions":

                    AttemptQuestionSerializer(

                        questions,

                        many=True

                    ).data,

            },

            status=status.HTTP_200_OK

        )





class SubmitAnswerView(APIView):

    permission_classes = [

        IsAdminOrTeacherOrStudent

    ]



    def post(self, request, attempt_id):

        if request.user.role != "STUDENT":

            return Response(

                {

                    "detail":

                        "Only students can submit answers."

                },

                status=status.HTTP_403_FORBIDDEN

            )



        try:

            attempt = TestAttempt.objects.select_related(

                "test"

            ).get(

                id=attempt_id,

                student=request.user

            )

        except TestAttempt.DoesNotExist:

            return Response(

                {

                    "detail":

                        "Attempt not found."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        if attempt.status != TestAttempt.Status.IN_PROGRESS:

            return Response(

                {

                    "detail":

                        "This attempt is already submitted."

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        serializer = SubmitAnswerSerializer(

            data=request.data

        )



        serializer.is_valid(

            raise_exception=True

        )



        question_id = serializer.validated_data[

            "question_id"

        ]



        selected_option_id = serializer.validated_data.get(

            "selected_option_id"

        )



        written_answer = serializer.validated_data.get(

            "written_answer",

            ""

        )



        try:

            test_question = attempt.test.test_questions.select_related(

                "question"

            ).get(

                question_id=question_id

            )

        except TestQuestion.DoesNotExist:

            return Response(

                {

                    "detail":

                        "Question does not belong to this test."

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        selected_option = None



        if selected_option_id:

            try:

                selected_option = QuestionOption.objects.get(

                    id=selected_option_id,

                    question_id=question_id,

                )

            except QuestionOption.DoesNotExist:

                return Response(

                    {

                        "detail":

                            "Selected option is invalid."

                    },

                    status=status.HTTP_400_BAD_REQUEST

                )



        answer, _ = TestAttemptAnswer.objects.update_or_create(

            attempt=attempt,

            question_id=question_id,

            defaults={

                "selected_option":

                    selected_option,

                "written_answer":

                    written_answer,

            }

        )



        return Response(

            {

                "message":

                    "Answer saved successfully.",

                "answer_id":

                    answer.id,

                "question_id":

                    question_id,

            },

            status=status.HTTP_200_OK

        )





class SubmitTestAttemptView(APIView):

    permission_classes = [

        IsAdminOrTeacherOrStudent

    ]



    @transaction.atomic

    def post(self, request, attempt_id):

        if request.user.role != "STUDENT":

            return Response(

                {

                    "detail":

                        "Only students can submit tests."

                },

                status=status.HTTP_403_FORBIDDEN

            )



        try:

            attempt = TestAttempt.objects.select_related(

                "test"

            ).get(

                id=attempt_id,

                student=request.user

            )

        except TestAttempt.DoesNotExist:

            return Response(

                {

                    "detail":

                        "Attempt not found."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        if attempt.status != TestAttempt.Status.IN_PROGRESS:

            return Response(

                {

                    "detail":

                        "This attempt is already submitted."

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        serializer = SubmitAttemptSerializer(

            data=request.data

        )



        serializer.is_valid(

            raise_exception=True

        )



        for item in serializer.validated_data.get(

            "answers",

            []

        ):

            question_id = item[

                "question_id"

            ]



            selected_option_id = item.get(

                "selected_option_id"

            )



            written_answer = item.get(

                "written_answer",

                ""

            )



            if not attempt.test.test_questions.filter(

                question_id=question_id

            ).exists():

                continue



            selected_option = None



            if selected_option_id:

                try:

                    selected_option = QuestionOption.objects.get(

                        id=selected_option_id,

                        question_id=question_id,

                    )

                except QuestionOption.DoesNotExist:

                    selected_option = None



            TestAttemptAnswer.objects.update_or_create(

                attempt=attempt,

                question_id=question_id,

                defaults={

                    "selected_option":

                        selected_option,

                    "written_answer":

                        written_answer,

                }

            )



        score = Decimal("0.00")



        test_questions = (

            attempt.test.test_questions.select_related(

                "question"

            ).all()

        )



        for test_question in test_questions:

            answer = TestAttemptAnswer.objects.filter(

                attempt=attempt,

                question=test_question.question

            ).select_related(

                "selected_option"

            ).first()



            if not answer:

                continue



            if (

                test_question.question.question_type

                == "MCQ"

            ):

                if (

                    answer.selected_option

                    and answer.selected_option.is_correct

                ):

                    answer.is_correct = True



                    answer.marks_obtained = (

                        test_question.marks

                    )



                    score += (

                        test_question.marks

                    )

                else:

                    answer.is_correct = False



                    answer.marks_obtained = (

                        -test_question.negative_marks

                    )



                    score -= (

                        test_question.negative_marks

                    )



                answer.save(

                    update_fields=[

                        "is_correct",

                        "marks_obtained",

                        "answered_at",

                    ]

                )



        score = max(

            Decimal("0.00"),

            score

        )



        total_marks = (

            attempt.test.total_marks

        )



        percentage = Decimal("0.00")



        if total_marks > 0:

            percentage = (

                score * Decimal("100")

            ) / total_marks



        attempt.score = score

        attempt.total_marks = total_marks

        attempt.percentage = percentage



        attempt.is_passed = (

            score >= attempt.test.passing_marks

        )



        attempt.status = (

            TestAttempt.Status.SUBMITTED

        )



        attempt.submitted_at = timezone.now()



        attempt.save(

            update_fields=[

                "score",

                "total_marks",

                "percentage",

                "is_passed",

                "status",

                "submitted_at",

            ]

        )


        passing_percentage = Decimal("0.00")

        if total_marks and total_marks > 0:
            passing_percentage = (
                attempt.test.passing_marks * Decimal("100.00")
            ) / total_marks

        correct_answers = 0
        wrong_answers = 0
        unanswered = 0

        for test_question in test_questions:
            answer = TestAttemptAnswer.objects.filter(
                attempt=attempt,
                question=test_question.question,
            ).select_related("selected_option").first()

            if answer is None:
                unanswered += 1
                continue

            if test_question.question.question_type == "MCQ":
                if answer.selected_option_id is None:
                    unanswered += 1
                elif answer.is_correct:
                    correct_answers += 1
                else:
                    wrong_answers += 1
            elif not (answer.written_answer or "").strip():
                unanswered += 1

        Result.objects.update_or_create(
            student=attempt.student,
            test=attempt.test,
            defaults={
                "obtained_marks": attempt.score,
                "total_marks": attempt.total_marks,
                "percentage": attempt.percentage,
                "passing_percentage": passing_percentage,
                "status": "PASS" if attempt.is_passed else "FAIL",
                "correct_answers": correct_answers,
                "wrong_answers": wrong_answers,
                "unanswered": unanswered,
                "submitted_at": attempt.submitted_at,
            },
        )



        return Response(

            TestAttemptSerializer(

                attempt

            ).data,

            status=status.HTTP_200_OK

        )





class MyAttemptsView(APIView):

    permission_classes = [

        IsAdminOrTeacherOrStudent

    ]



    def get(self, request):

        if request.user.role != "STUDENT":

            return Response(

                {

                    "detail":

                        "Only students can access attempts."

                },

                status=status.HTTP_403_FORBIDDEN

            )



        attempts = TestAttempt.objects.filter(

            student=request.user

        ).select_related(

            "test",

            "test__subject",

            "student"

        )



        return Response(

            TestAttemptSerializer(

                attempts,

                many=True

            ).data,

            status=status.HTTP_200_OK

        )





class AttemptDetailView(APIView):

    permission_classes = [

        IsAdminOrTeacherOrStudent

    ]



    def get(self, request, attempt_id):

        try:

            attempt = TestAttempt.objects.select_related(

                "test",

                "test__subject",

                "student"

            ).prefetch_related(

                "answers__selected_option"

            ).get(

                id=attempt_id

            )

        except TestAttempt.DoesNotExist:

            return Response(

                {

                    "detail":

                        "Attempt not found."

                },

                status=status.HTTP_404_NOT_FOUND

            )



        if (

            request.user.role == "STUDENT"

            and attempt.student_id != request.user.id

        ):

            return Response(

                {

                    "detail":

                        "You do not have permission."

                },

                status=status.HTTP_403_FORBIDDEN

            )



        return Response(

            {

                "attempt":

                    TestAttemptSerializer(

                        attempt

                    ).data,

                "answers": [

                    {

                        "id": answer.id,

                        "question_id":

                            answer.question_id,

                        "selected_option_id":

                            answer.selected_option_id,

                        "written_answer":

                            answer.written_answer,

                        "marks_obtained":

                            answer.marks_obtained,

                        "is_correct":

                            answer.is_correct,

                    }

                    for answer in attempt.answers.all()

                ],

            },

            status=status.HTTP_200_OK

        )


class TeacherDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "TEACHER":
            return Response(
                {"detail": "Only teachers can access this dashboard."},
                status=status.HTTP_403_FORBIDDEN,
            )

        tests = Test.objects.filter(
            created_by=request.user
        ).select_related("subject")

        test_ids = tests.values_list("id", flat=True)

        attempts = TestAttempt.objects.filter(
            test_id__in=test_ids,
            status__in=[
                TestAttempt.Status.SUBMITTED,
                TestAttempt.Status.AUTO_SUBMITTED,
            ],
        ).select_related("student", "test", "test__subject")

        students_count = attempts.values("student_id").distinct().count()
        total_tests = tests.count()
        active_tests = tests.filter(
            is_active=True,
            status=Test.Status.PUBLISHED,
        ).count()
        subjects_count = tests.values("subject_id").distinct().count()

        average_performance = attempts.aggregate(
            average=Avg("percentage")
        )["average"] or 0

        recent_tests = []
        for test in tests.order_by("-created_at")[:5]:
            test_attempts = attempts.filter(test=test)
            recent_tests.append({
                "id": test.id,
                "title": test.title,
                "subject": test.subject.name,
                "created_at": test.created_at,
                "status": (
                    "Active"
                    if test.is_active and test.status == Test.Status.PUBLISHED
                    else test.status.title()
                ),
                "attempts": test_attempts.count(),
            })

        recent_students = []
        latest_attempts = attempts.order_by("-submitted_at")[:5]

        for attempt in latest_attempts:
            recent_students.append({
                "id": attempt.student_id,
                "name": (
                    attempt.student.get_full_name()
                    or attempt.student.username
                ),
                "test": attempt.test.title,
                "subject": attempt.test.subject.name,
                "score": round(float(attempt.percentage or 0), 2),
                "status": (
                    "Excellent"
                    if attempt.percentage >= 85
                    else "Good"
                    if attempt.percentage >= 70
                    else "Needs Focus"
                ),
                "submitted_at": attempt.submitted_at,
            })

        return Response({
            "stats": {
                "students": students_count,
                "tests": total_tests,
                "active_tests": active_tests,
                "subjects": subjects_count,
                "average_performance": round(float(average_performance), 2),
                "total_attempts": attempts.count(),
            },
            "recent_tests": recent_tests,
            "recent_students": recent_students,
        })
