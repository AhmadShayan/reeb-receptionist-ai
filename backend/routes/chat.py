import re
import json
import uuid
import logging
import os
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models import ChatLog, Client, Meeting
from services.ai_service import get_ai_response, RuleBasedReceptionist
from services.email_service import send_meeting_confirmation
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

SCHEDULE_RE = re.compile(r'\[SCHEDULE:(\{.*?\})\]', re.DOTALL)


def _try_book_meeting(raw_json: str, client_id: Optional[int], client_name: str, db: Session) -> Optional[dict]:
    """Parse the [SCHEDULE:{...}] marker from Claude and create a Meeting row."""
    try:
        data = json.loads(raw_json)
    except json.JSONDecodeError:
        logger.warning("Could not parse SCHEDULE JSON: %s", raw_json)
        return None

    # Try to get client email if they're registered
    client_email = None
    if client_id:
        cl = db.query(Client).filter(Client.id == client_id).first()
        if cl:
            client_email = cl.email

    # Use RECEPTIONIST_EMAIL as fallback host email so the owner always gets notified
    host_email = data.get("host_email") or os.getenv("RECEPTIONIST_EMAIL")

    meeting = Meeting(
        client_id=client_id,
        client_name=client_name,
        client_email=client_email,
        host_name=data.get("host", "Staff Member"),
        host_email=host_email,
        date=data.get("date", "TBD"),
        time=data.get("time", "TBD"),
        duration=int(data.get("duration", 30)),
        purpose=data.get("purpose", ""),
        status="scheduled",
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    email_result = send_meeting_confirmation(
        meeting_id=meeting.id,
        client_name=meeting.client_name,
        client_email=meeting.client_email,
        host_name=meeting.host_name,
        host_email=meeting.host_email,
        date=meeting.date,
        time=meeting.time,
        duration=meeting.duration,
        purpose=meeting.purpose or "Meeting",
    )

    return {
        "id": meeting.id,
        "host": meeting.host_name,
        "date": meeting.date,
        "time": meeting.time,
        "duration": meeting.duration,
        "purpose": meeting.purpose,
        "email": email_result,
    }


@router.post("/")
async def chat(
    message: str = Body(..., embed=True),
    client_id: Optional[int] = Body(None, embed=True),
    session_id: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
):
    if not session_id:
        session_id = str(uuid.uuid4())

    client_name = None
    if client_id:
        client = db.query(Client).filter(Client.id == client_id).first()
        if client:
            client_name = client.name

    # Fetch recent conversation for context
    history = []
    recent_logs = (
        db.query(ChatLog)
        .filter(ChatLog.session_id == session_id)
        .order_by(desc(ChatLog.timestamp))
        .limit(8)
        .all()
    )
    for log in reversed(recent_logs):
        history.append({"user": log.user_message, "assistant": log.ai_response})

    raw_reply = await get_ai_response(message, client_name=client_name, conversation_history=history)

    # ── Check if Claude scheduled a meeting ──────────────────────────────────
    meeting_booked = None
    match = SCHEDULE_RE.search(raw_reply)
    if match:
        meeting_booked = _try_book_meeting(match.group(1), client_id, client_name or "Visitor", db)
        # Strip the marker from the reply shown to the visitor
        raw_reply = SCHEDULE_RE.sub("", raw_reply).strip()

        # Append a friendly confirmation line
        if meeting_booked:
            raw_reply += (
                f"\n\nI've gone ahead and booked that — you're all set! "
                f"Meeting #{meeting_booked['id']} with {meeting_booked['host']} "
                f"on {meeting_booked['date']} at {meeting_booked['time']}."
            )
            if meeting_booked.get("email", {}).get("visitor_email_sent"):
                raw_reply += " A confirmation email is on its way to you."

    # Save to DB
    db.add(ChatLog(
        client_id=client_id,
        session_id=session_id,
        user_message=message,
        ai_response=raw_reply,
    ))
    db.commit()

    return {
        "reply": raw_reply,
        "session_id": session_id,
        "client_name": client_name,
        "meeting_booked": meeting_booked,
    }


@router.get("/logs")
def get_chat_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = (
        db.query(ChatLog)
        .order_by(desc(ChatLog.timestamp))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": log.id,
            "session_id": log.session_id,
            "client_name": log.client.name if log.client else "Anonymous",
            "user_message": log.user_message,
            "ai_response": log.ai_response,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        }
        for log in logs
    ]


@router.post("/greeting")
async def get_greeting(
    client_id: Optional[int] = Body(None, embed=True),
    visit_count: Optional[int] = Body(0, embed=True),
    last_visit: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
):
    """Personalized greeting for a recognized client."""
    if client_id:
        client = db.query(Client).filter(Client.id == client_id).first()
        if client:
            bot = RuleBasedReceptionist()
            greeting = bot.get_recognition_greeting(
                client.name, visit_count or 0, last_visit or "recently"
            )
            return {"greeting": greeting, "client_name": client.name}

    return {
        "greeting": "Welcome to Agentic REEB AI! I'm REEB, your AI receptionist. How can I help you today?",
        "client_name": None,
    }
