import json
import logging
import os
import re

from google import genai
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class GenerateIncorrectOptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ("ADMIN", "TEACHER"):
            return Response(
                {"detail": "Only admin or teacher can generate options."},
                status=status.HTTP_403_FORBIDDEN,
            )

        question = str(request.data.get("question_text") or "").strip()
        answer = str(request.data.get("correct_answer") or "").strip()

        if not question or not answer:
            return Response(
                {"detail": "Question and correct answer are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(question) > 10000 or len(answer) > 2000:
            return Response(
                {"detail": "Question or answer is too long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        api_key = os.getenv("GEMINI_API_KEY")
        model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

        if not api_key:
            return Response(
                {"detail": "GEMINI_API_KEY is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        prompt = f"""
Generate exactly three plausible but incorrect answer options for this MCQ.

Return JSON only:
{{"options": ["option 1", "option 2", "option 3"]}}

Rules:
- Never repeat the correct answer.
- All three options must be distinct.
- Keep the options relevant to the question.
- Do not include A, B, C, or D labels.

Question: {json.dumps(question, ensure_ascii=False)}
Correct answer: {json.dumps(answer, ensure_ascii=False)}
"""

        try:
            client = genai.Client(api_key=api_key)

            result = client.models.generate_content(
                model=model,
                contents=prompt,
            )

            text = (result.text or "").strip()
            text = re.sub(
                r"^```(?:json)?\s*|\s*```$",
                "",
                text,
                flags=re.IGNORECASE,
            ).strip()

            data = json.loads(text)
            options = data.get("options")

            if not isinstance(options, list) or len(options) != 3:
                raise ValueError("Expected exactly three options.")

            clean_options = []
            seen = {" ".join(answer.casefold().split())}

            for option in options:
                if not isinstance(option, str) or not option.strip():
                    raise ValueError("Invalid option returned by AI.")

                option = option.strip()
                normalized = " ".join(option.casefold().split())

                if normalized in seen:
                    raise ValueError("AI returned duplicate options.")

                seen.add(normalized)
                clean_options.append(option[:500])

            return Response(
                {"options": clean_options},
                status=status.HTTP_200_OK,
            )

        except Exception:
            logger.exception("Incorrect option generation failed.")
            return Response(
                {
                    "detail": (
                        "AI option generation failed. Check the Gemini "
                        "model configuration and server logs."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )