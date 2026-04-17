import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def list_models():
    api_key_raw = os.getenv("GEMINI_API_KEY")
    if not api_key_raw:
        print("ERROR: GEMINI_API_KEY NOT FOUND")
        return

    api_keys = [k.strip() for k in api_key_raw.split(',')]
    key = api_keys[0]
    
    try:
        genai.configure(api_key=key)
        print("Available models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
    except Exception as e:
        print(f"FAILED to list models: {str(e)}")

if __name__ == "__main__":
    list_models()
