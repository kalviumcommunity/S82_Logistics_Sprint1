import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_report(report_text, recipient):
    """Send report via email. Credentials from env vars."""
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    try:
        smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    except (ValueError, TypeError):
        smtp_port = 587

    sender = os.environ.get("SENDER_EMAIL")
    password = os.environ.get("SENDER_PASSWORD")

    if not sender or not password:
        print("Email not configured. Skipping.")
        return False

    msg = MIMEMultipart()
    msg["Subject"] = "Weekly Analytics Report"
    msg["From"] = sender
    msg["To"] = recipient
    msg.attach(MIMEText(report_text, "plain"))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=10)
        server.starttls()
        server.login(sender, password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print("Send failed: " + str(e))
        return False


# Alias for flexible importing
send_report_email = send_report
