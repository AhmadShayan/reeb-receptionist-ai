from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routes import clients, recognize, chat, contact, admin
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Agentic REEB AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(clients.router, prefix="/api/clients", tags=["clients"])
app.include_router(recognize.router, prefix="/api/recognize", tags=["recognition"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(contact.router, prefix="/api/contact", tags=["contact"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.get("/")
async def root():
    return {"message": "Agentic REEB AI Backend", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
