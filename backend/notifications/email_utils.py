from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives


def send_student_email_notifications(subject, plain_message, html_message):
    User = get_user_model()

    students = (
        User.objects.filter(
            role="STUDENT",
            is_active=True,
        )
        .exclude(email__isnull=True)
        .exclude(email="")
        .distinct()
    )

    sent_count = 0

    for student in students.iterator():
        try:
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[student.email],
            )

            email.attach_alternative(html_message, "text/html")
            sent_count += email.send(fail_silently=True)

        except Exception:
            continue

    return sent_count