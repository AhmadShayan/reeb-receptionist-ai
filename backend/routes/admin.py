from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import get_db
from models import Client, Visit, ChatLog, ContactMessage

router = APIRouter()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_clients = db.query(func.count(Client.id)).scalar()
    total_visits = db.query(func.count(Visit.id)).scalar()
    total_chats = db.query(func.count(ChatLog.id)).scalar()
    total_messages = db.query(func.count(ContactMessage.id)).scalar()

    # Visits in the last 7 days
    from datetime import datetime, timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_visits = db.query(func.count(Visit.id)).filter(Visit.timestamp >= week_ago).scalar()

    # Most frequent visitors
    top_visitors = (
        db.query(Client.name, func.count(Visit.id).label("visit_count"))
        .join(Visit, Visit.client_id == Client.id, isouter=True)
        .group_by(Client.id)
        .order_by(desc("visit_count"))
        .limit(5)
        .all()
    )

    # Recent activity feed
    recent_visits_list = (
        db.query(Visit)
        .order_by(desc(Visit.timestamp))
        .limit(10)
        .all()
    )

    activity_feed = [
        {
            "type": "visit",
            "client_name": v.client.name if v.client else "Unknown",
            "timestamp": v.timestamp.isoformat() if v.timestamp else None,
            "notes": v.notes,
        }
        for v in recent_visits_list
    ]

    return {
        "total_clients": total_clients,
        "total_visits": total_visits,
        "total_chat_messages": total_chats,
        "total_contact_messages": total_messages,
        "visits_last_7_days": recent_visits,
        "top_visitors": [{"name": name, "visits": count} for name, count in top_visitors],
        "recent_activity": activity_feed,
    }


@router.get("/visits")
def get_all_visits(limit: int = 100, db: Session = Depends(get_db)):
    visits = (
        db.query(Visit)
        .order_by(desc(Visit.timestamp))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": v.id,
            "client_name": v.client.name if v.client else "Unknown",
            "client_id": v.client_id,
            "timestamp": v.timestamp.isoformat() if v.timestamp else None,
            "notes": v.notes,
        }
        for v in visits
    ]
