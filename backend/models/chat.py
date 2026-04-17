from pydantic import BaseModel
from typing import Optional

class ChatbotRequest(BaseModel):
    """User message to the chatbot"""
    symptom_or_mood: str  # e.g., "I had a headache all afternoon"

class ChatbotResponse(BaseModel):
    """Chatbot response with contextual analysis"""
    message: str  # Conversational explanation
    probable_causes: list  # List of probable causes
    relevant_factors: dict  # {factor: value} from user's recent logs
    suggestions: list  # What user can do
