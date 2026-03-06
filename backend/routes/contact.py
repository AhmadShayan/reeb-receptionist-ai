from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models import ContactMessage
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter()


class ContactForm(BaseModel):
    name: str
    email: str
    company: Optional[str] = ""
    message: str


@router.post("/")
def submit_contact(form: ContactForm, db: Session = Depends(get_db)):
    msg = ContactMessage(
        name=form.name,
        email=form.email,
        company=form.company,
        message=form.message,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {
        "success": True,
        "message": "Your message has been received. We'll get back to you within 24 hours.",
        "id": msg.id,
    }


@router.get("/")
def list_messages(db: Session = Depends(get_db)):
    messages = db.query(ContactMessage).order_by(desc(ContactMessage.created_at)).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "email": m.email,
            "company": m.company,
            "message": m.message,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


@router.delete("/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db)):
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(msg)
    db.commit()
    return {"message": "Deleted"}
