from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import get_db
from models import Client, Visit
from typing import List, Optional
import json
import math
import os

router = APIRouter()

RECOGNITION_THRESHOLD = 0.6  # Euclidean distance threshold — face-api.js recommends 0.6


def euclidean_distance(a: List[float], b: List[float]) -> float:
    if len(a) != len(b):
        return float("inf")
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


@router.post("/")
def recognize_face(
    descriptor: List[float] = Body(..., embed=True),
    auto_log_visit: bool = Body(True, embed=True),
    db: Session = Depends(get_db),
):
    """
    Compare an incoming face descriptor (128D float array from face-api.js)
    against all stored client descriptors and return the best match.
    """
    clients = db.query(Client).filter(Client.face_descriptor.isnot(None)).all()

    if not clients:
        return {"matched": False, "reason": "No registered faces in database"}

    best_match = None
    best_distance = float("inf")

    for client in clients:
        try:
            stored = json.loads(client.face_descriptor)
            distance = euclidean_distance(descriptor, stored)
            if distance < best_distance:
                best_distance = distance
                best_match = client
        except (json.JSONDecodeError, TypeError):
            continue

    if best_match and best_distance < RECOGNITION_THRESHOLD:
        # Log the visit
        if auto_log_visit:
            visit = Visit(client_id=best_match.id, notes="Face recognition entry")
            db.add(visit)
            db.commit()

        visits = db.query(Visit).filter(Visit.client_id == best_match.id).all()

        return {
            "matched": True,
            "confidence": round((1 - best_distance / RECOGNITION_THRESHOLD) * 100, 1),
            "distance": round(best_distance, 4),
            "client": {
                "id": best_match.id,
                "name": best_match.name,
                "email": best_match.email,
                "phone": best_match.phone,
                "department": best_match.department,
                "company": best_match.company,
                "photo_path": f"/uploads/{os.path.basename(best_match.photo_path)}" if best_match.photo_path else None,
                "visit_count": len(visits),
                "last_visit": visits[-1].timestamp.isoformat() if visits else None,
            },
        }
    else:
        return {
            "matched": False,
            "reason": "No matching face found",
            "closest_distance": round(best_distance, 4) if best_distance != float("inf") else None,
        }
