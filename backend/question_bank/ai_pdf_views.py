import logging
from decimal import Decimal, InvalidOperation

from django.db import transaction
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from subjects.models import Subject

from .models import Question, QuestionOption
from .serializers import QuestionSerializer
from .ai_pdf_utils import extract_pdf_text, parse_questions_with_gemini


logger = logging.getLogger(__name__)

ALLOWED_ROLES = {"ADMIN", "TEACHER"}
MAX_PDF_SIZE = 15 * 1024 * 1024
MAX_QUESTIONS = 300
ALLOWED_TYPES = {"MCQ", "WRITTEN"}
ALLOWED_DIFFICULTIES = {"EASY", "MEDIUM", "HARD"}


class AIPDFPreviewView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if request.user.role not in ALLOWED_ROLES:
            return Response(
                {
                    "detail": (
                        "Only admin or teacher can use AI Question Generator."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        pdf_file = request.FILES.get("file")

        if not pdf_file:
            return Response(
                {
                    "file": (
                        "PDF file is missing. Upload the file using "
                        "the multipart field named 'file'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not pdf_file.name.lower().endswith(".pdf"):
            return Response(
                {"file": "Only PDF files are supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pdf_file.size == 0:
            return Response(
                {"file": "The uploaded PDF is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pdf_file.size > MAX_PDF_SIZE:
            return Response(
                {"file": "PDF size must not exceed 15 MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pdf_text = extract_pdf_text(pdf_file)

            if not pdf_text or not pdf_text.strip():
                return Response(
                    {
                        "detail": (
                            "No readable text was found in the PDF. "
                            "If it is a scanned PDF, check that OCR "
                            "and Tesseract are installed correctly."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            questions = parse_questions_with_gemini(pdf_text)

            if not isinstance(questions, list) or not questions:
                return Response(
                    {
                        "detail": (
                            "No questions were generated. "
                            "Try another PDF with readable study material."
                        )
                    },
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            return Response(
                {
                    "message": (
                        "Questions generated successfully. "
                        "Review them before saving."
                    ),
                    "total_questions": len(questions),
                    "questions": questions,
                },
                status=status.HTTP_200_OK,
            )

        except ValueError as exc:
            logger.warning(
                "AI PDF validation failed: %s",
                exc,
            )
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception:
            logger.exception("AI PDF processing failed")

            return Response(
                {
                    "detail": (
                        "PDF processing failed. Check the Django "
                        "terminal for the detailed error."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )


class AIPDFSaveQuestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ALLOWED_ROLES:
            return Response(
                {
                    "detail": (
                        "Only admin or teacher can save questions."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        subject_id = request.data.get("subject_id")
        questions_data = request.data.get("questions")

        if not subject_id:
            return Response(
                {"subject_id": "Subject is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(questions_data, list) or not questions_data:
            return Response(
                {
                    "questions": (
                        "Select at least one question to save."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(questions_data) > MAX_QUESTIONS:
            return Response(
                {
                    "questions": (
                        f"You can save up to {MAX_QUESTIONS} questions "
                        "at a time."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            subject = Subject.objects.get(pk=subject_id)
        except (Subject.DoesNotExist, ValueError, TypeError):
            return Response(
                {"subject_id": "Invalid subject."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prepared_questions = []

        for index, item in enumerate(questions_data):
            question_number = index + 1

            if not isinstance(item, dict):
                return Response(
                    {
                        "questions": (
                            f"Question {question_number} is invalid."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            question_text = str(
                item.get("question_text") or ""
            ).strip()

            question_type = str(
                item.get("question_type") or "MCQ"
            ).strip().upper()

            difficulty = str(
                item.get("difficulty") or "MEDIUM"
            ).strip().upper()

            if not question_text:
                return Response(
                    {
                        "questions": (
                            f"Question {question_number} has no text."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if question_type not in ALLOWED_TYPES:
                return Response(
                    {
                        "questions": (
                            f"Question {question_number} has an "
                            "invalid question type."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if difficulty not in ALLOWED_DIFFICULTIES:
                return Response(
                    {
                        "questions": (
                            f"Question {question_number} has an "
                            "invalid difficulty."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                marks = Decimal(str(item.get("marks", 1)))
            except (InvalidOperation, TypeError, ValueError):
                return Response(
                    {
                        "questions": (
                            f"Question {question_number} has invalid marks."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if (
                not marks.is_finite()
                or marks <= 0
                or marks > Decimal("9999.99")
            ):
                return Response(
                    {
                        "questions": (
                            f"Question {question_number} has invalid marks."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            options = item.get("options", [])

            if question_type == "MCQ":
                if not isinstance(options, list) or len(options) < 2:
                    return Response(
                        {
                            "questions": (
                                f"MCQ {question_number} needs at least "
                                "two options."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                valid_options = []
                correct_count = 0

                for option in options:
                    if not isinstance(option, dict):
                        return Response(
                            {
                                "questions": (
                                    f"MCQ {question_number} contains "
                                    "an invalid option."
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    option_text = str(
                        option.get("option_text") or ""
                    ).strip()

                    if not option_text:
                        return Response(
                            {
                                "questions": (
                                    f"MCQ {question_number} contains "
                                    "an empty option."
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    if len(option_text) > 500:
                        return Response(
                            {
                                "questions": (
                                    f"An option in MCQ {question_number} "
                                    "exceeds 500 characters."
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    is_correct = option.get("is_correct") is True

                    if is_correct:
                        correct_count += 1

                    valid_options.append(
                        {
                            "option_text": option_text,
                            "is_correct": is_correct,
                        }
                    )

                if correct_count != 1:
                    return Response(
                        {
                            "questions": (
                                f"MCQ {question_number} must have exactly "
                                "one correct option. Review the answer "
                                "before saving."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                options = valid_options

            else:
                options = []

            prepared_questions.append(
                {
                    "question_text": question_text,
                    "question_type": question_type,
                    "difficulty": difficulty,
                    "marks": marks,
                    "explanation": str(
                        item.get("explanation") or ""
                    ).strip(),
                    "options": options,
                }
            )

        created_questions = []

        try:
            with transaction.atomic():
                for item in prepared_questions:
                    question = Question.objects.create(
                        subject=subject,
                        question_text=item["question_text"],
                        question_type=item["question_type"],
                        difficulty=item["difficulty"],
                        marks=item["marks"],
                        explanation=item["explanation"],
                        created_by=request.user,
                        is_active=True,
                    )

                    for order, option in enumerate(
                        item["options"],
                        start=1,
                    ):
                        QuestionOption.objects.create(
                            question=question,
                            option_text=option["option_text"],
                            is_correct=option["is_correct"],
                            order=order,
                        )

                    created_questions.append(question)

        except Exception:
            logger.exception("Failed to save AI-generated questions")
            return Response(
                {
                    "detail": (
                        "Questions could not be saved. "
                        "Check the Django terminal for the detailed error."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = QuestionSerializer(
            created_questions,
            many=True,
            context={"request": request},
        )

        return Response(
            {
                "message": (
                    "Approved questions saved to the Question Bank."
                ),
                "created_count": len(created_questions),
                "questions": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )