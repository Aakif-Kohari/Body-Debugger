from pydantic import BaseModel
from typing import Optional

class ChatbotRequest(BaseModel):
    """User message to the chatbot"""
    symptom: str  # Matches frontend 'symptom'
    context: Optional[dict] = None # Matches frontend 'context'

class ChatbotResponse(BaseModel):
    """Chatbot response with contextual analysis"""
    message: str  # Conversational explanation
    probable_causes: list  # List of probable causes
    relevant_factors: dict  # {factor: value} from user's recent logs
    suggestions: list  # What user can do
