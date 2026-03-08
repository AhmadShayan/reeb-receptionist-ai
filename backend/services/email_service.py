"""
Email Service — Gmail SMTP
--------------------------
Sends meeting confirmation emails to both the visitor and the host.
No domain or paid service needed — just a Gmail + App Password.

Setup:
  1. Enable 2FA on your Gmail account
  2. Google Account → Security → App Passwords → create one for "Mail"
  3. Set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(os.getenv("GMAIL_USER") and os.getenv("GMAIL_APP_PASSWORD") and
                not os.getenv("GMAIL_APP_PASSWORD", "").startswith("your_"))


def _send_email(to: str, subject: str, html_body: str) -> bool:
    """Send a single email via Gmail SMTP. Returns True on success."""
    if not _smtp_configured():
        logger.warning("Email not configured — skipping send to %s", to)
        return False

    gmail_user = os.getenv("GMAIL_USER")
    gmail_pass = os.getenv("GMAIL_APP_PASSWORD")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"REEB AI Receptionist <{gmail_user}>"
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            server.login(gmail_user, gmail_pass)
            server.sendmail(gmail_user, to, msg.as_string())
        logger.info("Email sent to %s — %s", to, subject)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        return False


def _meeting_card_html(
    meeting_id: int,
    client_name: str,
    host_name: str,
    date: str,
    time: str,
    duration: int,
    purpose: str,
) -> str:
    """Returns a styled HTML email card for a meeting confirmation."""
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#1a1d27;border-radius:12px;
              border:1px solid #2a2d3d;overflow:hidden;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:2px;
                text-transform:uppercase;margin-bottom:6px;">Agentic REEB AI</p>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">
        Meeting Confirmed ✓
      </h1>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #2a2d3d;color:#9ca3af;
                     font-size:13px;width:110px;">Visitor</td>
          <td style="padding:10px 0;border-bottom:1px solid #2a2d3d;color:#f1f5f9;
                     font-size:14px;font-weight:600;">{client_name}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #2a2d3d;color:#9ca3af;font-size:13px;">Meeting With</td>
          <td style="padding:10px 0;border-bottom:1px solid #2a2d3d;color:#f1f5f9;font-size:14px;font-weight:600;">{host_name}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #2a2d3d;color:#9ca3af;font-size:13px;">Date</td>
          <td style="padding:10px 0;border-bottom:1px solid #2a2d3d;color:#f1f5f9;font-size:14px;">{date}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #2a2d3d;color:#9ca3af;font-size:13px;">Time</td>
          <td style="padding:10px 0;border-bottom:1px solid #2a2d3d;color:#f1f5f9;font-size:14px;">{time} ({duration} min)</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#9ca3af;font-size:13px;vertical-align:top;padding-top:12px;">Purpose</td>
          <td style="padding:10px 0;color:#f1f5f9;font-size:14px;padding-top:12px;">{purpose}</td>
        </tr>
      </table>

      <div style="margin-top:24px;padding:14px 16px;background:#6366f1/10;
                  border-left:3px solid #6366f1;border-radius:4px;">
        <p style="margin:0;color:#a5b4fc;font-size:13px;">
          Please arrive 5 minutes early and check in at the REEB AI reception kiosk.
          Your meeting ID is <strong style="color:#c4b5fd;">#{meeting_id}</strong>.
        </p>
      </div>
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;background:#13151f;border-top:1px solid #2a2d3d;">
      <p style="margin:0;color:#4b5563;font-size:12px;">
        This confirmation was sent automatically by REEB AI Receptionist.<br>
        Reply to this email if you need to reschedule.
      </p>
    </div>
  </div>
</body>
</html>
"""


def send_meeting_confirmation(
    meeting_id: int,
    client_name: str,
    client_email: Optional[str],
    host_name: str,
    host_email: Optional[str],
    date: str,
    time: str,
    duration: int,
    purpose: str,
) -> dict:
    """
    Send confirmation emails to both the visitor and the host.
    Returns a dict with send status for each recipient.
    """
    html = _meeting_card_html(meeting_id, client_name, host_name, date, time, duration, purpose)
    subject = f"Meeting Confirmed — {client_name} & {host_name} on {date} at {time}"

    results = {"visitor_email_sent": False, "host_email_sent": False, "email_configured": _smtp_configured()}

    if client_email and "@" in client_email:
        results["visitor_email_sent"] = _send_email(client_email, subject, html)

    if host_email and "@" in host_email and host_email != client_email:
        results["host_email_sent"] = _send_email(host_email, subject, html)

    return results


def send_meeting_cancellation(
    meeting_id: int,
    client_name: str,
    client_email: Optional[str],
    host_name: str,
    host_email: Optional[str],
    date: str,
    time: str,
) -> None:
    """Send cancellation notice to relevant parties."""
    if not _smtp_configured():
        return

    subject = f"Meeting Cancelled — {client_name} & {host_name} on {date}"
    html = f"""
<!DOCTYPE html><html><body style="background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;padding:32px;">
<div style="max-width:480px;margin:0 auto;background:#1a1d27;border-radius:12px;
            border:1px solid #ef4444;padding:28px;">
  <h2 style="color:#ef4444;margin-top:0;">Meeting Cancelled</h2>
  <p style="color:#9ca3af;">The following meeting has been cancelled:</p>
  <p style="color:#f1f5f9;"><strong>{client_name}</strong> with <strong>{host_name}</strong><br>
  {date} at {time}</p>
  <p style="color:#6b7280;font-size:12px;">Meeting ID: #{meeting_id} · REEB AI Receptionist</p>
</div></body></html>
"""
    if client_email and "@" in client_email:
        _send_email(client_email, subject, html)
    if host_email and "@" in host_email and host_email != client_email:
        _send_email(host_email, subject, html)
