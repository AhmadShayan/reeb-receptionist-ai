"""
Seed demo data for the Agentic REEB AI presentation.
Run: python seed_data.py
This adds sample clients and visit history so the demo looks populated.
"""

from database import SessionLocal, engine, Base
from models import Client, Visit, ContactMessage
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)

DEMO_CLIENTS = [
    {"name": "Mian Khizar", "email": "khizarmian492@gmail.com", "phone": "03090124039", "department": "Management", "company": "Agentic REEB AI"},
    {"name": "Meer Ali Abbas", "email": "meer.ali@reebaai.com", "phone": "03001234567", "department": "Executive", "company": "Agentic REEB AI"},
    {"name": "Sarah Johnson", "email": "sarah.j@techcorp.com", "phone": "03012345678", "department": "IT", "company": "TechCorp Ltd"},
    {"name": "Ahmed Hassan", "email": "ahmed.h@globalfinance.com", "phone": "03098765432", "department": "Finance", "company": "Global Finance"},
    {"name": "Emily Chen", "email": "emily.c@innovate.io", "phone": "03045678901", "department": "Engineering", "company": "Innovate.io"},
]

DEMO_MESSAGES = [
    {"name": "Dr. Raza Khan", "email": "raza@hospital.pk", "company": "City Hospital", "message": "Interested in deploying REEB AI for our hospital reception. Please schedule a demo at your earliest convenience."},
    {"name": "Fatima Malik", "email": "fatima@hotel-dubai.ae", "company": "Prestige Hotels", "message": "We run a chain of 5 hotels and are evaluating AI receptionist solutions. REEB AI looks very promising!"},
    {"name": "James Carter", "email": "james.c@coworkspace.com", "company": "FlexWork Spaces", "message": "Would love to see how REEB handles visitor management for our co-working space. Can we get a trial?"},
]


def seed():
    db = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(Client).count() > 0:
            print("Database already has data. Skipping seed.")
            return

        print("Seeding demo data...")

        # Create clients
        for data in DEMO_CLIENTS:
            client = Client(**data)
            db.add(client)
            db.flush()  # Get ID

            # Add visit history (random past visits)
            num_visits = random.randint(2, 8)
            for i in range(num_visits):
                days_ago = random.randint(1, 90)
                visit_time = datetime.utcnow() - timedelta(days=days_ago)
                visit = Visit(
                    client_id=client.id,
                    timestamp=visit_time,
                    notes=random.choice([
                        "Regular visit",
                        "Meeting with management",
                        "Face recognition entry",
                        "Scheduled appointment",
                        "Project review",
                    ]),
                )
                db.add(visit)

        # Create contact messages
        for data in DEMO_MESSAGES:
            msg = ContactMessage(**data)
            db.add(msg)

        db.commit()
        print(f"Seeded {len(DEMO_CLIENTS)} clients and {len(DEMO_MESSAGES)} contact messages.")
        print("Done! Run the backend with: uvicorn main:app --reload --port 8000")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
