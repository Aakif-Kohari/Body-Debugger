"""
A3 - Gemini Service Setup
Initializes Gemini API client and provides reusable functions for all AI features
"""
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from typing import Dict, Any, List
import re
import itertools
from groq import Groq

load_dotenv()

class GeminiService:
    """Service for all Gemini API interactions"""
    
    def __init__(self):
        """Initialize Gemini API"""
        api_key_raw = os.getenv("GEMINI_API_KEY")
        if not api_key_raw:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Handle multiple keys if present
        api_keys = [k.strip() for k in api_key_raw.split(',')]
        primary_key = api_keys[0]
        
        genai.configure(api_key=primary_key)
        self.model = genai.GenerativeModel('gemini-flash-latest')
        
        # Setup Groq keys for round-robin rotation to avoid rate limits
        groq_keys_raw = os.getenv("GROQ_API_KEYS", "")
        self.groq_keys = [k.strip() for k in groq_keys_raw.split(',')] if groq_keys_raw else []
        self.groq_key_cycle = itertools.cycle(self.groq_keys) if self.groq_keys else None

    
    def ask_gemini(self, prompt: str, json_expected: bool = False) -> Any:
        """
        Generic method to ask a question.
        Uses Groq as the primary fast engine with key rotation, falling back to Gemini if all keys fail.
        
        Args:
            prompt: The prompt to send
            json_expected: If True, attempt to parse response as JSON
            
        Returns:
            Response text or parsed JSON
        """
        last_error = None
        for _ in range(len(self.groq_keys)):
            current_key = next(self.groq_key_cycle)
            try:
                client = Groq(api_key=current_key)
                response = client.chat.completions.create(
                    model='llama-3.3-70b-versatile',
                    messages=[{'role': 'user', 'content': prompt}]
                )
                text = response.choices[0].message.content
                
                if json_expected:
                    json_text = self._extract_json(text)
                    return json.loads(json_text)
                    
                return text
            except Exception as e:
                print(f"Groq API Error on key ({current_key[:8]}...): {str(e)}")
                last_error = e

        print("All Groq keys exceeded or failed. Falling back to Gemini API.")
        try:
            response = self.model.generate_content(prompt)
            text = response.text
            
            if json_expected:
                # Extract JSON from response (sometimes Gemini wraps it in markdown)
                json_text = self._extract_json(text)
                return json.loads(json_text)
            
            return text
        except Exception as e:
            raise RuntimeError(f"All AI APIs failed: {str(e)}")

    
    def analyze_image(self, image_bytes: bytes, prompt: str) -> str:
        """
        Analyze an image (like a photo of a lab report) using Gemini Vision
        
        Args:
            image_bytes: Raw image data
            prompt: Text instructions for analysis
            
        Returns:
            AI response text
        """
        try:
            # Newer google-generativeai pattern for multimodal inputs
            response = self.model.generate_content([
                prompt,
                {"mime_type": "image/jpeg", "data": image_bytes}
            ])
            return response.text
        except Exception as e:
            print(f"Gemini Vision error: {str(e)}")
            raise RuntimeError(f"Visual analysis failed: {str(e)}")
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON from text that might have markdown code blocks"""
        # Try to find JSON within code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            return json_match.group(1)
        
        # If no code block, try to find raw JSON
        json_match = re.search(r'(\{.*\})', text, re.DOTALL)
        if json_match:
            return json_match.group(1)
        
        # If nothing works, return the entire text
        return text
    
    # ========== REPORT TRANSLATION PROMPTS ==========
    
    def analyze_lab_report(self, raw_text: str) -> Dict[str, Any]:
        """
        Analyze raw lab report text and extract structured data
        
        Args:
            raw_text: OCR-extracted text from blood report
            
        Returns:
            Structured analysis with parameters, flags, and summary
        """
        prompt = f"""You are a medical AI assistant helping people understand their blood test results. 
Analyze this blood report and provide a structured JSON response with the following format:
{{
    "parameters": [
        {{
            "parameter_name": "Parameter name (e.g., Hemoglobin, TSH)",
            "user_value": "The actual value from the report",
            "normal_range": "Normal range for this parameter",
            "plain_english_meaning": "2-3 sentence explanation of what this means in simple terms",
            "lifestyle_tip": "1 specific actionable tip to improve this, if not normal",
            "risk_flag": "green" (normal), "yellow" (slightly abnormal), or "red" (concerning)
        }}
    ],
    "summary_for_doctor": "A brief 2-3 line summary of key findings to discuss with doctor",
    "overall_health_assessment": "Overall assessment in 2-3 sentences",
    "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}}

Blood Report Text:
{raw_text}

Respond ONLY with valid JSON, no markdown code blocks."""

        return self.ask_gemini(prompt, json_expected=True)
    
    # ========== FOOD PARSING PROMPTS ==========
    
    def parse_food_input(self, meal_description: str) -> Dict[str, Any]:
        """
        Parse natural language meal description and estimate calories/macros
        
        Args:
            meal_description: Natural language description (e.g., "2 rotis, dal, sabzi")
            
        Returns:
            Structured breakdown with items and nutritional info
        """
        prompt = f"""You are a nutrition AI assistant. Analyze this meal description and provide estimated nutritional breakdown.
Respond with ONLY this JSON format (no markdown, no explanation):
{{
    "items": [
        {{
            "item_name": "Item name",
            "quantity": "Estimated quantity (e.g., '2 pieces', '1 plate')",
            "calories": 250,
            "protein_grams": 10,
            "carbs_grams": 35,
            "fat_grams": 5
        }}
    ],
    "total_calories": 250,
    "total_protein": 10,
    "total_carbs": 35,
    "total_fat": 5
}}

If the user provides dummy text, a random greeting, or anything clearly NOT related to food/meals, return ONLY this JSON:
{{
    "error": "Please provide a correct meal description. This does not appear to be food."
}}

For Indian cuisine, use reasonable estimates. If unsure about vague foods, do your best to estimate.

Meal Description: {meal_description}"""
        try:
            response = self.ask_gemini(prompt, json_expected=True)
            # Ensure response has the right structure
            if isinstance(response, dict):
                if "error" in response:
                    raise ValueError(response["error"])
                return response
            return {"items": [], "total_calories": 0}
        except ValueError as e:
            raise e
        except Exception as e:
            raise ValueError(f"AI could not parse your meal: {str(e)}")
    
    # ========== CHATBOT PROMPTS ==========
    
    def analyze_symptom_with_context(self, 
                                     symptom: str, 
                                     user_profile: Dict[str, Any] = None,
                                     recent_sleep_hours: float = None,
                                     recent_water_intake: float = None,
                                     recent_food_items: List[str] = None,
                                     recent_report_values: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Analyze user's symptom/mood with context from their health logs
        
        Args:
            symptom: User's reported symptom or mood
            user_profile: Dict containing demographic info like age, sex, goals
            recent_sleep_hours: Hours slept last night
            recent_water_intake: Water intake in ml
            recent_food_items: List of recent food items
            recent_report_values: Recent lab report values
            
        Returns:
            Conversational response with probable causes
        """
        context_str = ""
        if user_profile:
            age = user_profile.get("age")
            goals = ", ".join(user_profile.get("goals", []))
            if age:
                context_str += f"- User Age: {age} years old\n"
            if goals:
                context_str += f"- Health Goals: {goals}\n"
        
        if recent_sleep_hours:
            context_str += f"- Sleep last night: {recent_sleep_hours} hours\n"
        if recent_water_intake:
            context_str += f"- Water intake today: {recent_water_intake}ml\n"
        if recent_food_items:
            context_str += f"- Recent meals: {', '.join(recent_food_items)}\n"
        if recent_report_values:
            report_str = ", ".join([f"{k}: {v}" for k, v in recent_report_values.items()])
            context_str += f"- Recent lab values: {report_str}\n"
        
        prompt = f"""You are a friendly health AI assistant. The user has reported: "{symptom}"

Here's their recent health context:
{context_str if context_str else "No recent health data available"}

Provide a conversational response that:
1. Acknowledges their concern
2. Suggests 2-3 probable causes based on their logs
3. Recommends 2-3 immediate actions they can take
4. Gently suggests seeing a doctor if symptoms persist

Keep a friendly, Indian-English tone. Use "bhai/behen" if appropriate.
Respond as natural conversational text, starting directly (no JSON)."""

        return {
            "message": self.ask_gemini(prompt),
            "symptom": symptom,
            "context": context_str
        }


# Create singleton instance
gemini_service = GeminiService()
