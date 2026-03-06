from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200))
    phone = Column(String(50))
    department = Column(String(100))
    company = Column(String(100))
    photo_path = Column(String(500))
    face_descriptor = Column(Text)  # JSON array of 128 floats from face-api.js
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    visits = relationship("Visit", back_populates="client", cascade="all, delete-orphan")
    chat_logs = relationship("ChatLog", back_populates="client", cascade="all, delete-orphan")


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)

    client = relationship("Client", back_populates="visits")


class ChatLog(Base):
    __tablename__ = "chat_logs"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    session_id = Column(String(100))
    user_message = Column(Text)
    ai_response = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Client", back_populates="chat_logs")


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(200))
    company = Column(String(100))
    message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
