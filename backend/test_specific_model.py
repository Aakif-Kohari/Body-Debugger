import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def test_stable_model():
    api_key_raw = os.getenv("GEMINI_API_KEY")
    api_keys = [k.strip() for k in api_key_raw.split(',')]
    key = api_keys[0]
    
    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content("Say 'Key is working'")
        print(f"SUCCESS! Response: {response.text}")
    except Exception as e:
        print(f"FAILED with gemini-flash-latest: {str(e)}")

if __name__ == "__main__":
    test_stable_model()
