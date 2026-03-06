from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models import Client, Visit
from typing import Optional
import json
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads"


def client_to_dict(client: Client, include_visits: bool = False):
    data = {
        "id": client.id,
        "name": client.name,
        "email": client.email,
        "phone": client.phone,
        "department": client.department,
        "company": client.company,
        "photo_path": f"/uploads/{os.path.basename(client.photo_path)}" if client.photo_path else None,
        "has_face": client.face_descriptor is not None,
        "created_at": client.created_at.isoformat() if client.created_at else None,
    }
    if include_visits:
        data["visits"] = [
            {
                "id": v.id,
                "timestamp": v.timestamp.isoformat() if v.timestamp else None,
                "notes": v.notes,
            }
            for v in sorted(client.visits, key=lambda x: x.timestamp or "", reverse=True)
        ]
        data["visit_count"] = len(client.visits)
        latest = max(client.visits, key=lambda v: v.timestamp or "", default=None)
        data["last_visit"] = latest.timestamp.isoformat() if latest and latest.timestamp else None
    return data


@router.get("/")
def list_clients(db: Session = Depends(get_db)):
    clients = db.query(Client).order_by(desc(Client.created_at)).all()
    return [client_to_dict(c, include_visits=True) for c in clients]


@router.get("/{client_id}")
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client_to_dict(client, include_visits=True)


@router.post("/")
async def create_client(
    name: str = Form(...),
    email: str = Form(""),
    phone: str = Form(""),
    department: str = Form(""),
    company: str = Form(""),
    face_descriptor: str = Form(""),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    photo_path = None
    if photo and photo.filename:
        ext = os.path.splitext(photo.filename)[1] or ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        path = os.path.join(UPLOAD_DIR, filename)
        with open(path, "wb") as f:
            content = await photo.read()
            f.write(content)
        photo_path = path

    client = Client(
        name=name,
        email=email,
        phone=phone,
        department=department,
        company=company,
        photo_path=photo_path,
        face_descriptor=face_descriptor if face_descriptor else None,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client_to_dict(client, include_visits=True)


@router.put("/{client_id}")
async def update_client(
    client_id: int,
    name: str = Form(...),
    email: str = Form(""),
    phone: str = Form(""),
    department: str = Form(""),
    company: str = Form(""),
    face_descriptor: str = Form(""),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    client.name = name
    client.email = email
    client.phone = phone
    client.department = department
    client.company = company

    if face_descriptor:
        client.face_descriptor = face_descriptor

    if photo and photo.filename:
        # Remove old photo
        if client.photo_path and os.path.exists(client.photo_path):
            os.remove(client.photo_path)
        ext = os.path.splitext(photo.filename)[1] or ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        path = os.path.join(UPLOAD_DIR, filename)
        with open(path, "wb") as f:
            content = await photo.read()
            f.write(content)
        client.photo_path = path

    db.commit()
    db.refresh(client)
    return client_to_dict(client, include_visits=True)


@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if client.photo_path and os.path.exists(client.photo_path):
        os.remove(client.photo_path)
    db.delete(client)
    db.commit()
    return {"message": "Client deleted"}


@router.post("/{client_id}/visit")
def log_visit(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    visit = Visit(client_id=client_id, notes="Auto-logged via face recognition")
    db.add(visit)
    db.commit()
    return {"message": "Visit logged", "client_name": client.name}
