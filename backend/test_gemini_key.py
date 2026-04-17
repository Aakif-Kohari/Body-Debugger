import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def test_key():
    api_key_raw = os.getenv("GEMINI_API_KEY")
    print(f"DEBUG: Raw key from .env: {api_key_raw}")
    
    if not api_key_raw:
        print("ERROR: GEMINI_API_KEY NOT FOUND")
        return

    api_keys = [k.strip() for k in api_key_raw.split(',')]
    for i, key in enumerate(api_keys):
        print(f"\n--- Testing Key {i+1} ---")
        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content("Hello, this is a test.")
            print(f"SUCCESS! Response: {response.text[:50]}...")
        except Exception as e:
            print(f"FAILED: {str(e)}")

if __name__ == "__main__":
    test_key()
