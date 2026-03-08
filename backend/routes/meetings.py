"""
Meetings API
------------
Full CRUD for scheduled meetings.
The AI chat route also uses book_meeting() directly when Claude triggers scheduling.
"""

import os
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models import Meeting, Client
from services.email_service import send_meeting_confirmation, send_meeting_cancellation
from typing import Optional
from pydantic import BaseModel

router = APIRouter()


# ─── Schema ───────────────────────────────────────────────────────────────────

class MeetingCreate(BaseModel):
    client_id: Optional[int] = None
    client_name: str
    client_email: Optional[str] = None
    host_name: str
    host_email: Optional[str] = None
    date: str          # YYYY-MM-DD
    time: str          # HH:MM (24h)
    duration: int = 30
    purpose: Optional[str] = None
    notes: Optional[str] = None


def meeting_to_dict(m: Meeting) -> dict:
    return {
        "id": m.id,
        "client_id": m.client_id,
        "client_name": m.client_name,
        "client_email": m.client_email,
        "host_name": m.host_name,
        "host_email": m.host_email,
        "date": m.date,
        "time": m.time,
        "duration": m.duration,
        "purpose": m.purpose,
        "status": m.status,
        "notes": m.notes,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/")
def list_meetings(
    status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all meetings, optionally filtered by status."""
    query = db.query(Meeting).order_by(Meeting.date, Meeting.time)
    if status:
        query = query.filter(Meeting.status == status)
    return [meeting_to_dict(m) for m in query.limit(limit).all()]


@router.post("/")
def create_meeting(data: MeetingCreate, db: Session = Depends(get_db)):
    """Book a new meeting and send confirmation emails."""
    # Auto-fill client email from DB if client_id given but no email provided
    client_email = data.client_email
    if data.client_id and not client_email:
        client = db.query(Client).filter(Client.id == data.client_id).first()
        if client and client.email:
            client_email = client.email

    # Default host email to RECEPTIONIST_EMAIL so owner always receives confirmation
    host_email = data.host_email or os.getenv("RECEPTIONIST_EMAIL")

    meeting = Meeting(
        client_id=data.client_id,
        client_name=data.client_name,
        client_email=client_email,
        host_name=data.host_name,
        host_email=host_email,
        date=data.date,
        time=data.time,
        duration=data.duration,
        purpose=data.purpose,
        status="scheduled",
        notes=data.notes,
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
        purpose=meeting.purpose or "General meeting",
    )

    result = meeting_to_dict(meeting)
    result["email"] = email_result
    return result


@router.get("/availability")
def check_availability(
    date: str,
    time: str,
    host_name: str,
    duration: int = 30,
    db: Session = Depends(get_db),
):
    """Check if a host is free at the requested date/time."""
    conflicts = (
        db.query(Meeting)
        .filter(
            Meeting.date == date,
            Meeting.host_name.ilike(f"%{host_name}%"),
            Meeting.status == "scheduled",
        )
        .all()
    )

    def _time_to_mins(t: str) -> int:
        h, m = map(int, t.split(":"))
        return h * 60 + m

    req_start = _time_to_mins(time)
    req_end = req_start + duration

    for c in conflicts:
        c_start = _time_to_mins(c.time)
        c_end = c_start + c.duration
        if req_start < c_end and req_end > c_start:
            return {
                "available": False,
                "conflict": meeting_to_dict(c),
                "message": f"{host_name} already has a meeting at {c.time} on {date}.",
            }

    return {"available": True, "message": f"{host_name} is free at {time} on {date}."}


@router.get("/{meeting_id}")
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    m = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting_to_dict(m)


@router.patch("/{meeting_id}/status")
def update_status(
    meeting_id: int,
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    """Update meeting status: scheduled / cancelled / completed."""
    m = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")

    old_status = m.status
    m.status = status
    db.commit()
    db.refresh(m)

    if status == "cancelled" and old_status == "scheduled":
        send_meeting_cancellation(
            meeting_id=m.id,
            client_name=m.client_name,
            client_email=m.client_email,
            host_name=m.host_name,
            host_email=m.host_email,
            date=m.date,
            time=m.time,
        )

    return meeting_to_dict(m)


@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    m = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(m)
    db.commit()
    return {"deleted": True, "id": meeting_id}
