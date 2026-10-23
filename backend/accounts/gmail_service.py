import base64
import json
import os
from email.message import EmailMessage

from django.conf import settings
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"


def send_password_reset_email(to_email, subject, message):
    token_base64 = os.getenv("GMAIL_TOKEN_JSON_BASE64", "").strip()
    sender_email = os.getenv("GMAIL_SENDER_EMAIL", "").strip()

    if not token_base64 or not sender_email:
        raise RuntimeError("Gmail environment variables are missing.")

    token_json = base64.b64decode(token_base64).decode("utf-8")
    token_data = json.loads(token_json)

    credentials = Credentials.from_authorized_user_info(
        token_data,
        scopes=[GMAIL_SEND_SCOPE],
    )

    email_message = EmailMessage()
    email_message["To"] = to_email
    email_message["From"] = sender_email
    email_message["Subject"] = subject
    email_message.set_content(message)

    encoded_message = base64.urlsafe_b64encode(
        email_message.as_bytes()
    ).decode("utf-8")

    service = build("gmail", "v1", credentials=credentials)
    service.users().messages().send(
        userId="me",
        body={"raw": encoded_message},
    ).execute()