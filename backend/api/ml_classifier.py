import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Curated inline training dataset representing common phishing/scam patterns and legitimate emails/SMS.
TRAINING_DATA = [
    # Phishing / Scam (Label 1)
    ("URGENT: Your bank account has been suspended due to suspicious activity. Verify now at http://secure-bank-login.net", 1),
    ("Dear customer, we detected an unauthorized login attempt from Russia. If this wasn't you, reset your password immediately at https://security-verification-net.com/login", 1),
    ("CONGRATULATIONS! You have won a $1,000 Walmart Gift Card! Claim your reward now by clicking here: http://win-giftcard.xyz", 1),
    ("Your Netflix account payment failed. Please update your billing information within 24 hours to avoid suspension: http://netflix-billing-update.com", 1),
    ("NOTICE: Your package could not be delivered due to incomplete address. Pay the redirection fee of $1.50 at http://usps-redirection.info", 1),
    ("Tax refund alert: You are eligible for a tax refund of $432.10. Claim your credit immediately by filling out this form: http://irs-refund-portal.org", 1),
    ("URGENT security alert for your crypto wallet. Upgrade to the new secure protocol to protect your assets: http://metamask-security.co", 1),
    ("Your Apple ID has been locked for security reasons. Unlock your profile now by verifying your credentials: http://apple-verification-support.com", 1),
    ("Hey! I saw your profile and liked you. Check out my photos here and message me: http://scam-dating-link.xyz/pics", 1),
    ("Get rich quick! Invest $100 in our automated Bitcoin trading bot and earn $5000 daily guaranteed. Join now at http://quick-crypto-earn.club", 1),
    ("Your credit card has been charged $1,250.00 for Amazon purchases. If you did not make this transaction, dispute it immediately: http://amazon-dispute-portal.net", 1),
    ("Your Microsoft password expires today. Keep the same password by confirming your corporate login here: http://microsoft-login-verify.com", 1),
    ("ALERT: Critical security patch required for your account. Download and run the attachment patch.exe immediately.", 1),
    ("Immediate action required: Confirm your social security number to reactivate your employee benefits profile.", 1),
    ("We have hacked your webcam and have embarrassing recordings. Pay $500 in Bitcoin to this address or we will release them to your contacts.", 1),
    ("Verify your identity immediately to prevent permanent account deletion. Click here to confirm: http://verify-identity-link.com", 1),
    ("Dear client, your PayPal invoice #4829 for $599.99 is ready. Click here to cancel if this was a mistake: http://paypal-billing-cancel.com", 1),
    ("Congratulations! Your resume was selected for a remote work-from-home position earning $80/hr. Deposit the setup fee at http://job-setup-pay.org", 1),
    ("Alert: Your UPS package is held at our warehouse. Click the link to pay outstanding duties: http://ups-delivery-duty.com", 1),
    ("Urgent security patch: Chrome browser has a critical vulnerability. Click here to install update now: http://chrome-update-safety.net", 1),
    
    # Legitimate (Label 0)
    ("Hi team, just a reminder that our weekly progress meeting is scheduled for tomorrow at 10:00 AM in the main conference room.", 0),
    ("Hey Joshua, are we still on for lunch today at 1 PM? Let me know if you want to try that new Italian place down the street.", 0),
    ("Your order #1029384 has been shipped and is on its way. You can track your package details on our official portal.", 0),
    ("Thanks for subscribing to our newsletter! You will receive weekly updates regarding software development, React, and Django.", 0),
    ("Hi, I completed the code reviews for the pull request. Let's merge it once the CI/CD pipeline builds successfully.", 0),
    ("Here is the updated project budget spreadsheet. Let me know if you have any questions or feedback before the board meeting.", 0),
    ("Dear candidate, thank you for interviewing with us. We are pleased to extend a job offer for the Software Engineer role.", 0),
    ("Your monthly electricity bill is now available. Log in to your utility portal to view the statement and make a payment.", 0),
    ("Happy birthday, Joshua! Wishing you a wonderful day filled with joy, laughter, and success. Hope to catch up soon!", 0),
    ("Hi Arpan, can you please double-check the database migration script? I want to make sure it doesn't drop the production schema.", 0),
    ("The draft for the CyberSentinel documentation is ready. Let's review the abstract and introduction sections this afternoon.", 0),
    ("Hi, this is a automated notification that your password has been successfully changed. If you did this, no action is needed.", 0),
    ("Hello, your dental checkup appointment is confirmed for Friday, June 26th at 3:30 PM. Please arrive 10 minutes early.", 0),
    ("Your flight ticket to Chicago is confirmed. Flight details: AA-2409, departing 8:45 AM. Boarding pass is available in your app.", 0),
    ("Dear customer, your bank statement for May 2026 is now ready for download. Log in securely to your online banking portal.", 0),
    ("Hi Merry, can you share the training metrics of the new XGBoost model? I want to add them to our final presentation slides.", 0),
    ("Hi, please find attached the receipts from our business trip last week. Let me know if you need any other documents for reimbursement.", 0),
    ("Your subscription to the cybersecurity newsletter has been successfully renewed. Thank you for your continued support.", 0),
    ("Hello, the library books you requested are now ready for pickup. Please collect them by next Tuesday.", 0),
    ("Hey, could you help me move this weekend? I need to carry some heavy furniture. I'll buy pizza and drinks for everyone!", 0),
]

class PhishingClassifier:
    def __init__(self):
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                ngram_range=(1, 2),
                stop_words='english',
                lowercase=True,
                token_pattern=r'(?u)\b\w+\b'
            )),
            ('clf', LogisticRegression(C=5.0, solver='liblinear'))
        ])
        self.trained = False
        self.train_model()

    def train_model(self):
        texts = [item[0] for item in TRAINING_DATA]
        labels = [item[1] for item in TRAINING_DATA]
        
        # Add some variation by expanding vocabulary dynamically
        self.pipeline.fit(texts, labels)
        self.trained = True
        
        # Cache top keywords for quick explanation lookup
        feature_names = self.pipeline.named_steps['tfidf'].get_feature_names_out()
        coefficients = self.pipeline.named_steps['clf'].coef_[0]
        self.feature_weights = dict(zip(feature_names, coefficients))

    def analyze_text(self, text):
        if not text or not isinstance(text, str) or not text.strip():
            return {
                "risk_score": 0.0,
                "risk_level": "Low",
                "threat_indicators": [],
                "highlighted_words": [],
                "recommendations": ["Please enter text to analyze for security threats."]
            }

        if not self.trained:
            self.train_model()

        # Clean text basic normalization
        cleaned_text = text.lower()
        
        # Predict probability
        prob = self.pipeline.predict_proba([text])[0][1] # Probability of label 1 (Phishing)
        risk_score = float(round(prob * 100, 2))
        
        # Classify risk level
        if risk_score < 30:
            risk_level = "Low"
        elif risk_score < 50:
            risk_level = "Medium"
        elif risk_score < 80:
            risk_level = "High"
        else:
            risk_level = "Critical"

        # Highlight words and extract indicators
        threat_indicators = []
        highlighted_words = []
        recommendations = [
            "Do not click on any links in this message.",
            "Verify the sender's identity through another channel.",
            "Do not share passwords, pins, or personal data.",
            "Report this message to your security team."
        ]

        # Explicit keywords check (rule-based overlays)
        urgent_keywords = ["urgent", "immediately", "suspension", "suspend", "action required", "expires today", "unauthorized", "locked", "billing failed"]
        financial_keywords = ["gift card", "won", "lottery", "bitcoin", "crypto", "rich", "refund", "credit", "invoice", "fee", "charged", "claim"]
        credential_keywords = ["verify now", "reset your password", "confirm identity", "credentials", "login", "signin", "social security", "identity verification"]
        link_keywords = ["http://", "https://", "click here", "link"]

        has_urgency = any(kw in cleaned_text for kw in urgent_keywords)
        has_finance = any(kw in cleaned_text for kw in financial_keywords)
        has_credentials = any(kw in cleaned_text for kw in credential_keywords)
        has_suspicious_links = re.search(r'https?://[^\s]+', cleaned_text) is not None

        if has_urgency:
            threat_indicators.append({
                "type": "Urgency",
                "severity": "High",
                "description": "Urgent language or false deadlines designed to induce panic and force fast action."
            })
        if has_finance:
            threat_indicators.append({
                "type": "Financial Bait",
                "severity": "Medium",
                "description": "Mentions of lottery wins, gift cards, invoices, refunds, or crypto investments."
            })
        if has_credentials:
            threat_indicators.append({
                "type": "Credential Harvesting",
                "severity": "Critical",
                "description": "Direct requests to confirm identities, reset passwords, or enter login credentials."
            })
        if has_suspicious_links:
            # Check if domain looks suspicious
            urls = re.findall(r'https?://([^\s/]+)', cleaned_text)
            suspicious_domains = False
            for url in urls:
                # Basic check for suspicious TLDs or missing common domains
                if any(url.endswith(tld) for tld in ['.xyz', '.club', '.info', '.work', '.click', '.cc', '.live']):
                    suspicious_domains = True
                # Mimicking checks
                if any(x in url for x in ['paypa1', 'netflix-', 'apple-verification', 'amazon-dispute', 'microsoft-login']):
                    suspicious_domains = True
            
            if suspicious_domains:
                threat_indicators.append({
                    "type": "Suspicious Destination Domain",
                    "severity": "Critical",
                    "description": "URLs in this message lead to non-standard domains or mimic known brands."
                })
            else:
                threat_indicators.append({
                    "type": "Hyperlink Present",
                    "severity": "Low",
                    "description": "Contains clickable links. Verify links carefully before clicking."
                })

        # Token explanation (Extract words contributing positively to phishing classification)
        words = re.findall(r'\b\w+\b', text)
        seen_words = set()
        
        for w in words:
            wl = w.lower()
            if wl in seen_words:
                continue
            seen_words.add(wl)
            
            # Look up feature weight
            weight = self.feature_weights.get(wl, 0.0)
            
            # Boost weight based on rules if not captured by TF-IDF
            if wl in urgent_keywords:
                weight += 1.5
            if wl in financial_keywords:
                weight += 1.2
            if wl in credential_keywords:
                weight += 2.0
            
            if weight > 0.3:
                # Classify weight into threat level for word highlighting
                if weight > 1.5:
                    word_severity = "critical"
                    reason = "High phishing association. Prompts sensitive action or contains credential traps."
                elif weight > 0.8:
                    word_severity = "high"
                    reason = "Scam alert word indicating financial gain or high urgency."
                else:
                    word_severity = "medium"
                    reason = "Suspicious keyword often associated with social engineering."
                
                highlighted_words.append({
                    "word": w,
                    "severity": word_severity,
                    "weight": float(round(weight, 2)),
                    "reason": reason
                })

        # If it's classified as safe (Low risk), clear major negative indicators
        if risk_score < 30:
            threat_indicators = [ind for ind in threat_indicators if ind['severity'] == "Low"]
            highlighted_words = [hw for hw in highlighted_words if hw['weight'] < 0.8]
            recommendations = [
                "This message appears to be safe.",
                "Always exercise caution when responding to unexpected requests.",
                "Ensure your system antivirus and security definitions are up to date."
            ]

        # Ensure we have at least some recommendations
        if risk_score >= 30 and not threat_indicators:
            threat_indicators.append({
                "type": "Unusual Sentiment",
                "severity": "Medium",
                "description": "System detected language patterns correlating with suspicious social engineering campaigns."
            })

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "threat_indicators": threat_indicators,
            "highlighted_words": highlighted_words,
            "recommendations": recommendations
        }

# Singleton instance
classifier = PhishingClassifier()
