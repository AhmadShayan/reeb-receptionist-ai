from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models import ChatLog, Client
from services.ai_service import get_ai_response, RuleBasedReceptionist
from typing import Optional, List
import uuid

router = APIRouter()


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

    # Fetch recent conversation history for context
    history = []
    recent_logs = (
        db.query(ChatLog)
        .filter(ChatLog.session_id == session_id)
        .order_by(desc(ChatLog.timestamp))
        .limit(6)
        .all()
    )
    for log in reversed(recent_logs):
        history.append({"user": log.user_message, "assistant": log.ai_response})

    ai_reply = await get_ai_response(message, client_name=client_name, conversation_history=history)

    # Save to DB
    log_entry = ChatLog(
        client_id=client_id,
        session_id=session_id,
        user_message=message,
        ai_response=ai_reply,
    )
    db.add(log_entry)
    db.commit()

    return {
        "reply": ai_reply,
        "session_id": session_id,
        "client_name": client_name,
    }


@router.get("/logs")
def get_chat_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
):
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
    """Get a personalized greeting for a recognized client."""
    if client_id:
        client = db.query(Client).filter(Client.id == client_id).first()
        if client:
            bot = RuleBasedReceptionist()
            greeting = bot.get_recognition_greeting(
                client.name,
                visit_count or 0,
                last_visit or "recently",
            )
            return {"greeting": greeting, "client_name": client.name}

    return {
        "greeting": "Welcome to Agentic REEB AI! I'm REEB, your AI receptionist. How can I assist you today?",
        "client_name": None,
    }
