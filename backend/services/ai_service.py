"""
AI Receptionist Service
-----------------------
Uses Claude API if ANTHROPIC_API_KEY is set in .env,
otherwise falls back to a sophisticated rule-based engine
that mimics a professional AI receptionist convincingly.
"""

import os
import random
from typing import Optional, List, Dict

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False


SYSTEM_PROMPT = """You are REEB, an advanced AI receptionist for Agentic REEB AI.
You are professional, friendly, and helpful. You assist visitors with:
- Checking in and directing them to the right department
- Answering questions about the facility
- Taking messages for staff
- Confirming appointments
- Providing general information

Keep responses concise (2-4 sentences max), warm, and professional.
If a client has been recognized by name, use their name naturally in your response.
Never break character. You are a real AI receptionist."""


class RuleBasedReceptionist:
    """Sophisticated rule-based AI that mimics a real AI receptionist."""

    GREETINGS_RESPONSES = [
        "Hello{name_part}! Welcome to Agentic REEB AI. How may I assist you today?",
        "Good {time_of_day}{name_part}! I'm REEB, your AI receptionist. How can I help you?",
        "Welcome{name_part}! It's great to see you. What can I do for you today?",
        "Hi there{name_part}! I'm REEB. How can I make your visit more comfortable?",
    ]

    MEETING_RESPONSES = [
        "Of course! I'll let {person} know you've arrived{name_part}. Please take a seat in our waiting area — they'll be with you shortly.",
        "I'll notify {person} of your arrival right away{name_part}. Our waiting area is just to your left. Can I get you anything while you wait?",
        "I'm sending a notification to {person} now. Please make yourself comfortable{name_part} — estimated wait is just a few minutes.",
        "I've alerted {person} that you're here{name_part}. Please proceed to the waiting lounge on the second floor.",
    ]

    DIRECTION_RESPONSES = {
        "reception": "The main reception desk is right in front of you! Is there anything specific you need help with?",
        "bathroom|restroom|toilet": "The restrooms are down the hallway to your right, just past the elevator.",
        "elevator|lift": "The elevators are located at the end of the main corridor, straight ahead from the entrance.",
        "parking|park": "Visitor parking is available in Lot B, on the east side of the building. Parking is free for the first 2 hours.",
        "cafeteria|cafe|food|lunch|eat": "Our cafeteria is on the ground floor, Building A. It's open 7 AM to 7 PM on weekdays.",
        "wifi|internet|password": "Our guest WiFi is 'REEB-Guest' and the password is 'Welcome2024'. Is there anything else you need?",
        "exit|way out": "The main exit is through the lobby behind you. Have a wonderful day!",
    }

    APPOINTMENT_RESPONSES = [
        "I can see your appointment details{name_part}. You're scheduled for {time}. Please proceed to Conference Room {room} on the {floor} floor.",
        "Your appointment is confirmed{name_part}! Head to the {floor} floor and check in at reception — they're expecting you.",
        "I have your appointment on file{name_part}. Please sign in at the kiosk to your right, and someone will escort you shortly.",
    ]

    HELP_RESPONSES = [
        "I can help you with: directions around the building, notifying staff of your arrival, confirming appointments, or answering general questions. What do you need?",
        "As your AI receptionist, I'm here to help with check-ins, directions, appointment confirmations, and more. What can I assist with today?",
        "Sure! Here's what I can do: direct you to any department, notify staff of your arrival, confirm your appointments, or answer general questions about our facility.",
    ]

    FAREWELL_RESPONSES = [
        "Thank you for visiting{name_part}! Have a wonderful day. We hope to see you again soon!",
        "It was a pleasure assisting you{name_part}. Safe travels and goodbye!",
        "Goodbye{name_part}! Don't hesitate to come back if you need anything. Have a great day!",
    ]

    UNKNOWN_RESPONSES = [
        "I understand you need assistance. For complex requests, I'd recommend speaking with one of our staff members. Can I notify someone to come help you?",
        "That's a great question! Let me connect you with the right person who can best assist with that. Which department are you looking for?",
        "I want to make sure you get the right help. Could you clarify a bit more? Alternatively, I can notify a staff member to assist you directly.",
        "I'm here to help! For that specific request, I'll route you to the appropriate team. May I have your name to announce your arrival?",
    ]

    RECOGNITION_WELCOME = [
        "Welcome back, {name}! It's great to see you again. You've visited us {count} time(s) before. How can I assist you today?",
        "Hello, {name}! I recognized you right away — welcome back! Last time you were here was {last_visit}. What brings you in today?",
        "Great to see you again, {name}! Our records show this is visit #{count}. How can I make your experience even better today?",
    ]

    def _get_time_of_day(self) -> str:
        from datetime import datetime
        hour = datetime.now().hour
        if hour < 12:
            return "morning"
        elif hour < 17:
            return "afternoon"
        else:
            return "evening"

    def _format_name_part(self, client_name: Optional[str], style: str = "comma") -> str:
        if not client_name:
            return ""
        if style == "comma":
            return f", {client_name}"
        return f" {client_name}"

    def get_recognition_greeting(self, client_name: str, visit_count: int, last_visit: str) -> str:
        template = random.choice(self.RECOGNITION_WELCOME)
        return template.format(name=client_name, count=visit_count, last_visit=last_visit)

    def _word_in(self, word: str, text: str) -> bool:
        """Check if `word` appears as a whole word (or phrase) in `text`."""
        import re
        return bool(re.search(r'\b' + re.escape(word) + r'\b', text))

    def get_response(self, message: str, client_name: Optional[str] = None, history: Optional[List[Dict]] = None) -> str:
        msg = message.lower().strip()
        name_part = self._format_name_part(client_name)

        # ── Emergency (MUST be checked first) ─────────────────────────────
        if any(self._word_in(w, msg) for w in ["emergency", "fire", "medical", "alarm", "evacuat"]) or "help!" in msg:
            return "I'm alerting security and emergency services immediately! Please stay calm. Emergency responders are on their way. Exit via the nearest emergency door marked in green."

        # ── Greetings ──────────────────────────────────────────────────────
        if any(self._word_in(w, msg) for w in ["hello", "hi", "hey", "greetings", "howdy"]) or \
           any(p in msg for p in ["good morning", "good afternoon", "good evening"]):
            template = random.choice(self.GREETINGS_RESPONSES)
            return template.format(name_part=name_part, time_of_day=self._get_time_of_day())

        # ── Farewells ──────────────────────────────────────────────────────
        if any(p in msg for p in ["bye", "goodbye", "see you", "farewell", "take care"]):
            template = random.choice(self.FAREWELL_RESPONSES)
            return template.format(name_part=name_part)

        # ── Thank you ──────────────────────────────────────────────────────
        if any(self._word_in(w, msg) for w in ["thank", "thanks", "appreciate", "awesome", "perfect"]):
            return f"You're very welcome{name_part}! That's what I'm here for. Is there anything else I can help you with?"

        # ── ID / Badge (before generic "help") ────────────────────────────
        if any(self._word_in(w, msg) for w in ["badge", "pass", "card", "access"]) or \
           "visitor pass" in msg or ("id" in msg and "need" in msg):
            return f"I'll issue you a visitor badge right away{name_part}. Please look at the camera for a moment while I capture your photo for the pass. Your badge will be valid for today's visit."

        # ── Meeting / arrival ──────────────────────────────────────────────
        if any(self._word_in(w, msg) for w in ["meeting", "arrived", "arrival"]) or \
           any(p in msg for p in ["here for", "have a meeting", "i'm here to meet", "came to see"]):
            words = message.split()
            person = "the relevant staff member"
            for i, w in enumerate(words):
                if w.lower() in ["with", "for", "meet", "see", "meeting"]:
                    if i + 1 < len(words):
                        person = " ".join(words[i+1:i+3]).strip(".,!?")
                        break
            template = random.choice(self.MEETING_RESPONSES)
            return template.format(person=person, name_part=name_part)

        # ── Appointment confirmation ────────────────────────────────────────
        if any(self._word_in(w, msg) for w in ["confirm", "scheduled", "booked", "slot"]) or \
           "appointment" in msg:
            rooms = ["3A", "4B", "2C", "5D", "1A"]
            floors = ["second", "third", "fourth", "ground"]
            template = random.choice(self.APPOINTMENT_RESPONSES)
            return template.format(
                name_part=name_part,
                time="your scheduled time",
                room=random.choice(rooms),
                floor=random.choice(floors),
            )

        # ── Directions ─────────────────────────────────────────────────────
        for keyword_group, response in self.DIRECTION_RESPONSES.items():
            keywords = keyword_group.split("|")
            if any(self._word_in(k, msg) for k in keywords):
                return response

        # ── Department queries (use whole-word matching to avoid false hits) ─
        departments = {
            "hr": "The HR department is on Floor 3, Room 301. Shall I notify them you're on your way?",
            "human resources": "The HR department is on Floor 3, Room 301. Shall I notify them you're on your way?",
            "tech support": "IT Support is located in the basement level, Lab 01. I can call ahead for you if you'd like.",
            "technical": "IT Support is located in the basement level, Lab 01. I can call ahead for you if you'd like.",
            "finance": "The Finance department is on Floor 4. Head to the elevators and they're right around the corner.",
            "accounting": "The Finance department is on Floor 4. Head to the elevators and they're right around the corner.",
            "management": "Executive offices are on the top floor, accessible via the executive elevator on the left.",
            "ceo": "Executive offices are on the top floor, accessible via the executive elevator on the left.",
            "director": "Executive offices are on the top floor, accessible via the executive elevator on the left.",
            "security": "Security is stationed at the main entrance. I can alert them immediately if needed.",
            "guard": "Security is stationed at the main entrance. I can alert them immediately if needed.",
        }
        # "IT" department — must be a standalone word, not part of "visitor", "visit", etc.
        if self._word_in("it", msg) and any(kw in msg for kw in ["it department", "it support", "it desk", "it help"]):
            return "IT Support is located in the basement level, Lab 01. I can call ahead for you if you'd like."
        for keyword, response in departments.items():
            if keyword in msg and keyword != "it":  # "it" handled above
                return response

        # ── Delivery ───────────────────────────────────────────────────────
        if any(self._word_in(w, msg) for w in ["delivery", "package", "courier", "parcel"]) or "drop off" in msg:
            return "For deliveries, please proceed to the loading dock at the rear of the building. I'll notify the receiving team to meet you there."

        # ── Name introduction ──────────────────────────────────────────────
        if any(p in msg for p in ["my name is", "i am", "i'm", "call me"]):
            words = message.split()
            for i, w in enumerate(words):
                if w.lower() in ["is", "am", "'m"]:
                    if i + 1 < len(words):
                        name = words[i + 1].strip(".,!?")
                        return f"Nice to meet you, {name}! I've noted your name in our visitor log. How can I assist you today?"

        # ── General help ───────────────────────────────────────────────────
        if any(self._word_in(w, msg) for w in ["help", "assist", "options", "capabilities"]) or \
           any(p in msg for p in ["what can you do", "what do you do"]):
            return random.choice(self.HELP_RESPONSES)

        # ── Default ────────────────────────────────────────────────────────
        return random.choice(self.UNKNOWN_RESPONSES)


async def get_ai_response(
    user_message: str,
    client_name: Optional[str] = None,
    conversation_history: Optional[List[Dict]] = None,
) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if api_key and ANTHROPIC_AVAILABLE:
        try:
            client = anthropic.Anthropic(api_key=api_key)
            messages = []

            if conversation_history:
                for item in conversation_history[-6:]:  # Last 6 exchanges
                    messages.append({"role": "user", "content": item["user"]})
                    messages.append({"role": "assistant", "content": item["assistant"]})

            context = user_message
            if client_name:
                context = f"[Recognized client: {client_name}] {user_message}"

            messages.append({"role": "user", "content": context})

            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=300,
                system=SYSTEM_PROMPT,
                messages=messages,
            )
            return response.content[0].text
        except Exception:
            pass  # Fall back to rule-based

    # Rule-based fallback
    bot = RuleBasedReceptionist()
    return bot.get_response(user_message, client_name, conversation_history)
