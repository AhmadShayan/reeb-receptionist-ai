"""
AI Receptionist Service
-----------------------
Uses Claude API (claude-sonnet-4-6) for natural, human-like responses.
Falls back to a sophisticated rule-based engine if API is unavailable.

Scheduling Flow:
  When Claude decides to book a meeting it appends a structured marker to its
  response:  [SCHEDULE:{"host":"...","date":"YYYY-MM-DD","time":"HH:MM",...}]

  The chat route strips this marker, books the meeting in the DB, sends emails,
  and returns the clean conversational reply to the visitor.
"""

import os
import re
import json
import random
from datetime import date
from typing import Optional, List, Dict

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False


# ─── System Prompt ────────────────────────────────────────────────────────────

def _build_system_prompt(client_name: Optional[str] = None) -> str:
    today = date.today().isoformat()
    visitor_line = f"The visitor you're currently talking to is {client_name}, who our system has already recognized." if client_name else ""

    return f"""You are REEB — the AI receptionist at Agentic REEB AI headquarters.

Your personality: warm, professional, and genuinely helpful. You sound like a real person at a front desk — friendly and conversational, never robotic or corporate. Use natural language. Short sentences work great. You can be a little witty when appropriate.

{visitor_line}

Today is {today}. Meetings can be scheduled at ANY time — 24 hours a day, 7 days a week. There are no restricted hours. Never tell a visitor a time slot is unavailable due to office hours.

What you can help with:
- Welcoming visitors and answering questions about the facility
- Giving directions to departments, meeting rooms, amenities (parking, cafeteria, WiFi, restrooms)
- Checking people in and notifying staff
- **Scheduling meetings** — see below

MEETING SCHEDULING:
When a visitor wants to schedule a meeting or says they have an appointment, naturally collect these four things through conversation:
1. Who they want to meet (person's name or department)
2. Date they prefer (convert casual dates like "tomorrow" or "next Monday" to YYYY-MM-DD)
3. Time (convert to HH:MM in 24-hour format)
4. Brief purpose or agenda

Once you have all four confirmed, end your message with EXACTLY this marker on a new line (no spaces around it):
[SCHEDULE:{{"host":"<name>","date":"<YYYY-MM-DD>","time":"<HH:MM>","duration":30,"purpose":"<text>"}}]

Example — if visitor says they want to meet Dr. Khan tomorrow at 2pm about a project review:
[SCHEDULE:{{"host":"Dr. Khan","date":"2025-03-09","time":"14:00","duration":30,"purpose":"Project review"}}]

IMPORTANT RULES:
- Never say "As an AI" or "I'm just a language model" — you are REEB, the receptionist
- Don't use excessive filler phrases like "Certainly!", "Absolutely!", "Of course!" — just be natural
- Keep responses concise — 1–3 sentences for most replies
- If someone mentions an emergency (fire, medical), tell them to call emergency services immediately and alert security
- Use the visitor's name naturally when you know it (not every sentence, just occasionally)
- Don't make up specific room numbers or staff schedules you don't know — offer to check or connect them with someone"""


# ─── Rule-based fallback ──────────────────────────────────────────────────────

class RuleBasedReceptionist:
    """Fallback when Claude API is unavailable."""

    GREETINGS = [
        "Hey{n}! Welcome to Agentic REEB AI. What can I help you with today?",
        "Hi{n}! I'm REEB, the front desk AI. How can I make your visit easier?",
        "Good {tod}{n}! What brings you in today?",
    ]
    FAREWELLS = [
        "Take care{n}! Hope to see you again soon.",
        "Have a great day{n}! Don't hesitate to swing by if you need anything.",
        "Goodbye{n}! Safe travels.",
    ]
    HELP = [
        "Happy to help! I can give you directions, notify staff that you're here, confirm appointments, or help schedule a meeting. What do you need?",
        "I've got you covered — directions, check-ins, scheduling, or general questions. What's on your mind?",
    ]
    THANKS = [
        "No problem at all{n}! Anything else I can do for you?",
        "Happy to help{n}! Let me know if there's anything else.",
    ]
    UNKNOWN = [
        "Let me connect you with the right person for that. Which department are you looking for?",
        "Good question — I want to make sure you get the right help. Can you give me a bit more detail?",
        "I'll do my best! For that kind of request, it might be worth speaking with one of our staff directly. Want me to notify someone?",
    ]
    EMERGENCY = "Please call emergency services (911) immediately! I'm alerting building security right now. Evacuate via the nearest green exit sign."

    DIRECTIONS = {
        "bathroom|restroom|toilet|washroom": "Restrooms are down the hallway to your right, just past the elevator.",
        "elevator|lift": "Elevators are at the end of the main corridor, straight ahead.",
        "parking|park": "Visitor parking is in Lot B, east side of the building — free for the first 2 hours.",
        "cafeteria|cafe|coffee|food|lunch|eat|canteen": "Cafeteria is on the ground floor, Building A. Open 7 AM – 7 PM weekdays.",
        "wifi|internet|password|network": "Guest WiFi: REEB-Guest · Password: Welcome2024",
        "exit|way out|leave": "Main exit is through the lobby behind you. Have a great day!",
        "reception|front desk": "You're here! This is the main reception. What do you need?",
    }

    DEPARTMENTS = {
        "hr|human resources": "HR is on Floor 3, Room 301. Want me to let them know you're on your way?",
        "it support|tech support|technical": "IT Support is in the basement, Lab 01. I can call ahead if you'd like.",
        "finance|accounting": "Finance is on Floor 4, right around the corner from the elevators.",
        "management|executive|ceo|director": "Executive offices are on the top floor via the exec elevator on the left.",
        "security|guard": "Security is stationed at the main entrance — I can alert them right away.",
    }

    def _n(self, name):
        return f", {name}" if name else ""

    def _tod(self):
        from datetime import datetime
        h = datetime.now().hour
        return "morning" if h < 12 else "afternoon" if h < 17 else "evening"

    def _has(self, words, text):
        for w in words.split("|"):
            if re.search(r'\b' + re.escape(w.strip()) + r'\b', text):
                return True
        return False

    def get_response(self, message: str, client_name: Optional[str] = None, **_) -> str:
        msg = message.lower().strip()
        n = self._n(client_name)

        # Emergency — always first
        if any(w in msg for w in ["emergency", "fire", "medical help", "heart attack", "evacuate"]) or "help!" in message:
            return self.EMERGENCY

        # Greeting
        if self._has("hello|hi|hey|howdy|greetings|good morning|good afternoon|good evening", msg):
            t = random.choice(self.GREETINGS)
            return t.format(n=n, tod=self._tod())

        # Farewell
        if self._has("bye|goodbye|see you|farewell|take care|leaving", msg):
            return random.choice(self.FAREWELLS).format(n=n)

        # Thanks
        if self._has("thank|thanks|appreciate|perfect|awesome|great", msg):
            return random.choice(self.THANKS).format(n=n)

        # Help
        if self._has("help|assist|what can you do|options", msg):
            return random.choice(self.HELP)

        # Badge / visitor pass
        if self._has("badge|visitor pass|access card", msg) or ("id" in msg and "need" in msg):
            return f"I'll get you a visitor badge right away{n}. Just look at the camera — it'll only take a second."

        # Scheduling
        if self._has("schedule|meeting|appointment|book|reserve", msg):
            return f"Of course{n}! I can schedule that for you. Who would you like to meet with, and when are you thinking?"

        # Directions
        for pattern, response in self.DIRECTIONS.items():
            if self._has(pattern, msg):
                return response

        # Departments
        for pattern, response in self.DEPARTMENTS.items():
            if self._has(pattern, msg):
                return response

        # Delivery
        if self._has("delivery|package|courier|parcel|drop off", msg):
            return "For deliveries, head to the loading dock at the rear of the building. I'll let the receiving team know you're coming."

        return random.choice(self.UNKNOWN)

    def get_recognition_greeting(self, client_name: str, visit_count: int, last_visit: str) -> str:
        templates = [
            f"Welcome back, {client_name}! Good to see you again — visit number {visit_count}. How can I help you today?",
            f"Hey {client_name}! I recognized you right away. You were last here {last_visit}. What brings you in?",
            f"Great to see you, {client_name}! This is visit #{visit_count} — you're basically a regular now. What can I do for you?",
        ]
        return random.choice(templates)


# ─── Claude API call ──────────────────────────────────────────────────────────

async def get_ai_response(
    user_message: str,
    client_name: Optional[str] = None,
    conversation_history: Optional[List[Dict]] = None,
) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if api_key and ANTHROPIC_AVAILABLE and not api_key.startswith("your_"):
        try:
            client = anthropic.Anthropic(api_key=api_key)

            messages = []
            if conversation_history:
                for item in conversation_history[-8:]:
                    messages.append({"role": "user", "content": item["user"]})
                    messages.append({"role": "assistant", "content": item["assistant"]})

            messages.append({"role": "user", "content": user_message})

            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=400,
                system=_build_system_prompt(client_name),
                messages=messages,
            )
            return response.content[0].text
        except Exception as e:
            # Log but don't crash — fall back to rule-based
            import logging
            logging.getLogger(__name__).warning("Claude API error: %s", e)

    # Rule-based fallback
    bot = RuleBasedReceptionist()
    return bot.get_response(user_message, client_name, history=conversation_history)
