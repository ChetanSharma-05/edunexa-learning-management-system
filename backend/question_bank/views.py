from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Question
from .serializers import QuestionSerializer


class QuestionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self, request):
        questions = Question.objects.select_related(
            "subject",
            "created_by",
        ).prefetch_related("options")

        if request.user.role == "TEACHER":
            questions = questions.filter(created_by=request.user)

        search = request.query_params.get("search", "").strip()
        subject = request.query_params.get("subject")
        question_type = request.query_params.get("question_type")
        difficulty = request.query_params.get("difficulty")
        is_active = request.query_params.get("is_active")

        if search:
            questions = questions.filter(
                question_text__icontains=search
            )

        if subject:
            questions = questions.filter(subject_id=subject)

        if question_type:
            questions = questions.filter(question_type=question_type)

        if difficulty:
            questions = questions.filter(difficulty=difficulty)

        if is_active in ["true", "false"]:
            questions = questions.filter(
                is_active=(is_active == "true")
            )

        return questions

    def get(self, request):
        if request.user.role not in ["ADMIN", "TEACHER"]:
            return Response(
                {"detail": "Only admin or teacher can access the question bank."},
                status=status.HTTP_403_FORBIDDEN,
            )

        questions = self.get_queryset(request)

        serializer = QuestionSerializer(
            questions,
            many=True,
            context={"request": request},
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role not in ["ADMIN", "TEACHER"]:
            return Response(
                {"detail": "Only admin or teacher can create questions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = QuestionSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        question = serializer.save(created_by=request.user)

        return Response(
            QuestionSerializer(
                question,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )


class QuestionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        try:
            question = Question.objects.select_related(
                "subject",
                "created_by",
            ).prefetch_related("options").get(pk=pk)
        except Question.DoesNotExist:
            return None

        if (
            request.user.role == "TEACHER"
            and question.created_by_id != request.user.id
        ):
            return None

        return question

    def get(self, request, pk):
        if request.user.role not in ["ADMIN", "TEACHER"]:
            return Response(
                {"detail": "Only admin or teacher can access questions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        question = self.get_object(request, pk)

        if question is None:
            return Response(
                {"detail": "Question not found or you do not have permission."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = QuestionSerializer(
            question,
            context={"request": request},
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        return self.update(request, pk, partial=False)

    def patch(self, request, pk):
        return self.update(request, pk, partial=True)

    def update(self, request, pk, partial=False):
        if request.user.role not in ["ADMIN", "TEACHER"]:
            return Response(
                {"detail": "Only admin or teacher can modify questions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        question = self.get_object(request, pk)

        if question is None:
            return Response(
                {"detail": "Question not found or you do not have permission."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = QuestionSerializer(
            question,
            data=request.data,
            partial=partial,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        question = serializer.save()

        return Response(
            QuestionSerializer(
                question,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        if request.user.role not in ["ADMIN", "TEACHER"]:
            return Response(
                {"detail": "Only admin or teacher can delete questions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        question = self.get_object(request, pk)

        if question is None:
            return Response(
                {"detail": "Question not found or you do not have permission."},
                status=status.HTTP_404_NOT_FOUND,
            )

        question.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)