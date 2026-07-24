import os
import sys

# Set UTF-8 encoding for Windows console output
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Setup Django env
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cybersentinel_backend.settings')
import django
django.setup()

from api.ml_classifier import classifier
from api.url_analyzer import analyze_url
from api.ocr_processor import extract_text_from_image
from api.chatbot_engine import get_bot_response

def run_tests():
    print("==========================================")
    print("   CYBERSENTINEL AI MODELS VERIFICATION   ")
    print("==========================================")

    # 1. Test Text Classifier
    sample_text = "URGENT: Your Netflix billing failed. Verify your password now at http://netflix-billing-update.com"
    print("\n[1] Testing Phishing Text Classifier...")
    text_result = classifier.analyze_text(sample_text)
    print(f"   Sample: '{sample_text[:50]}...'")
    print(f"   Risk Score: {text_result['risk_score']}% | Risk Level: {text_result['risk_level']}")
    print(f"   Threat Indicators: {len(text_result['threat_indicators'])}")
    print(f"   Highlighted Words: {[w['word'] for w in text_result['highlighted_words']]}")
    assert text_result['risk_score'] > 50, "Expected high risk score for phishing sample"

    # 2. Test URL Analyzer
    sample_url = "http://paypa1-security-login.xyz/verify"
    print("\n[2] Testing URL Analyzer...")
    url_result = analyze_url(sample_url)
    print(f"   URL: '{sample_url}'")
    print(f"   Risk Score: {url_result['risk_score']}% | Risk Level: {url_result['risk_level']}")
    print(f"   Brand Spoofing: {url_result['details'].get('brand_spoofing')}")
    assert url_result['risk_score'] > 70, "Expected critical risk score for spoofed URL"

    # 3. Test OCR Processor Fallback
    print("\n[3] Testing OCR Processor...")
    ocr_text, engine = extract_text_from_image("netflix_alert.png")
    print(f"   Engine: {engine}")
    print(f"   Extracted Snippet: '{ocr_text[:60]}...'")
    assert len(ocr_text) > 0, "Expected non-empty OCR text"

    # 4. Test Chatbot Engine
    print("\n[4] Testing AI Chatbot Engine...")
    chat_queries = [
        ("What is phishing?", "English"),
        ("How to check if link is safe?", "English"),
        ("Where to report phishing?", "Spanish")
    ]
    for q, lang in chat_queries:
        res = get_bot_response(q, lang)
        print(f"   Query ('{q}', '{lang}'):")
        print(f"   Response: {res['response'][:90]}...")
        print(f"   Intent: {res['intent']} | Action: {res.get('action')}")

    print("\n==========================================")
    print("   ALL AI MODELS VERIFIED SUCCESSFULLY!   ")
    print("==========================================")

if __name__ == '__main__':
    run_tests()
