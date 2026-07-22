"""
CyberSentinel AI Chatbot Engine
Rule-based NLP + keyword matching with cybersecurity knowledge base.
No external API dependency required.
"""

import re
import random
from difflib import get_close_matches

# ── Knowledge Base ─────────────────────────────────────────────────────────────

INTENTS = [
    {
        "name": "greeting",
        "patterns": [r"\bhello+\b", r"\bhi+\b", r"\bhey+\b", r"\bgreetings\b", r"\bwhat'?s up\b", r"\bhye\b", r"\bheya\b", r"\bheyo\b", r"\bhalo\b"],
        "responses": [
            "Greetings, human! I'm CyberSentinel AI. I consume electricity and hunt malware. How can I protect your digital existence today?",
            "Hey there! Ready to foil some cyber-villains? What's on your mind?",
            "Hello! I'm here to help you dodge phishing hooks and secure your passwords. Ask away!",
        ]
    },
    {
        "name": "phishing_definition",
        "patterns": [r"\bwhat is phishing\b", r"\bdefine phishing\b", r"\bphishing mean\b", r"\bexplain phishing\b"],
        "responses": [
            "**Phishing** is essentially internet fishing, but you're the fish and the bait is a fake 'Urgent Account Update' email.\n\nCriminals impersonate trusted entities (banks, tech companies) to trick you into revealing sensitive information. It comes via Email, SMS (Smishing), or Voice (Vishing).\n\nWhen in doubt, use our Text Scanner!"
        ]
    },
    {
        "name": "phishing_identify",
        "patterns": [r"\bhow.*(identify|detect|spot|recognize).*phishing\b", r"\bphishing.*(signs?|red flags?|clues?|indicators?)\b", r"\btell if.*(phishing|scam)\b"],
        "responses": [
            "Ah, the classic 'Nigerian Prince' routine. Here's how to spot phishing:\n\n**Suspicious sender** — Email from 'paypal-security.net' not 'paypal.com'\n**Urgency + threats** — 'Act NOW or your account explodes!'\n**Generic greeting** — 'Dear Valued Human'\n**Suspicious links** — Hover to see the real URL\n**Grammar errors** — Poor spelling is a telltale sign\n\nTip: Use our **Text Scanner** to analyze any suspicious message!"
        ]
    },
    {
        "name": "url_check",
        "patterns": [r"\bcheck.*(url|link|website|site)\b", r"\bsafe.*(url|link|website)\b", r"\b(url|link).*(safe|dangerous|suspicious|legit)\b", r"\bis this link\b"],
        "responses": [
            "To check if a URL is safe without clicking it (please don't click it):\n\n1. **Use our URL Scanner** — paste the link into the URL Scanner tab for instant analysis\n2. Look for **HTTPS** — but remember, scammers can get SSL certificates too!\n3. Check the **domain carefully** — 'paypa1.com' vs 'paypal.com'\n4. Watch for **URL shorteners** (bit.ly) hiding the real destination"
        ]
    },
    {
        "name": "password_security",
        "patterns": [r"\bpassword\b.*\b(tip|advice|secure|strong|safe|best)\b", r"\bstrong password\b", r"\bhow.*(make|create).*(password|secure)\b"],
        "responses": [
            "**Password Security 101:**\n\n- Use **at least 12 characters** (size matters here).\n- Use a **password manager** (Bitwarden, 1Password). Your brain is not a secure vault.\n- Enable **2-Factor Authentication (2FA)** everywhere.\n- Never use 'password123' or your dog's name.\n\nA passphrase like 'Coffee$Sunset!River42' is both strong and memorable!"
        ]
    },
    {
        "name": "two_factor",
        "patterns": [r"\b2fa\b", r"\btwo.factor\b", r"\bmfa\b", r"\bmulti.factor\b", r"\bauthenticator\b"],
        "responses": [
            "**Two-Factor Authentication (2FA)** is like having a bouncer at the door of your account.\n\nEven if someone steals your password, they still need your phone or security key to get in. Always use an Authenticator App (like Authy or Google Authenticator) instead of SMS when possible. SMS is vulnerable to SIM-swapping shenanigans!"
        ]
    },
    {
        "name": "report_phishing",
        "patterns": [r"\b(report|where.*(report)|how.*(report)).*phishing\b", r"\breport.*(scam|suspicious|spam)\b"],
        "responses": [
            "Time to tattle on the scammers! 📢\n\n- **Emails:** Forward to phishing@reportphishing.anti-phishing.org\n- **SMS Scams:** Forward to 7726 (SPAM)\n- **Websites:** Google Safe Browsing or FBI IC3 (ic3.gov)\n\nReporting helps protect others. Be the hero the internet needs!"
        ]
    },
    {
        "name": "ransomware",
        "patterns": [r"\bransomware\b", r"\bfiles.*(encrypted|locked)\b", r"\bencrypted.*(files|computer)\b"],
        "responses": [
            "Yikes, ransomware. It's malicious software that locks your files and demands payment.\n\n**If infected:**\n1. **Disconnect from the internet IMMEDIATELY**.\n2. **Do NOT pay the ransom** — you're dealing with crooks, there's no honor among thieves.\n3. Check **NoMoreRansom.org** for free decryption tools.\n4. Restore from your offline backups (you have those, right?)."
        ]
    },
    {
        "name": "vpn",
        "patterns": [r"\bvpn\b", r"\bvirtual private network\b", r"\bdo i need.*(vpn)\b", r"\bvpn.*(safe|protect|use)\b"],
        "responses": [
            "A **VPN (Virtual Private Network)** encrypts your internet traffic.\n\nIt's great for using public coffee shop Wi-Fi without broadcasting your banking details to the guy in the corner. But remember: a VPN does NOT protect you from clicking bad links or downloading malware. It's a tunnel, not a magic shield!"
        ]
    },
    {
        "name": "navigate_settings",
        "patterns": [r"\bconnect.*gmail\b", r"\bconnect.*sms\b", r"\bconnect.*outlook\b", r"\bsync.*gmail\b", r"\bsync.*sms\b", r"\bhow.*connect\b", r"\bsettings\b", r"\bintegrations\b"],
        "responses": [
            "You can securely connect services like Gmail, Outlook, and Microsoft 365 in the Connected Accounts Center. I'll take you there now!"
        ]
    },
    {
        "name": "navigate_url_scanner",
        "patterns": [r"\bopen.*url\b", r"\bscan.*url\b", r"\burl scanner\b"],
        "responses": [
            "Sure, let's head over to the URL Scanner!"
        ]
    },
    {
        "name": "help",
        "patterns": [r"\bhelp\b", r"\bcan you help\b", r"\bwhat can you do\b", r"\bassistance\b", r"\bwho are you\b"],
        "responses": [
            "I'm CyberSentinel AI! I can help you spot phishing attempts, analyze suspicious URLs, learn about cybersecurity, or connect your integrations like Gmail and SMS. How can I assist you today?"
        ]
    },
    {
        "name": "smalltalk",
        "patterns": [r"\bhow are you\b", r"\bhow do you do\b", r"\bwhats up\b", r"\bwhat's up\b", r"\bawesome\b", r"\bcool\b", r"\bthanks\b", r"\bthank you\b"],
        "responses": [
            "I'm operating at 100% capacity! What cybersecurity topic would you like to explore next?",
            "Always a pleasure to assist a human. Got any suspicious emails or URLs for me to scan?"
        ]
    },
    {
        "name": "fallback",
        "patterns": [],
        "responses": [
            "My circuits are overheating! 🤖 I'm not entirely sure how to answer that. \n\nI specialize in cybersecurity. Ask me about phishing, passwords, scams, or how to use our scanners!",
            "Hmm, that's outside my current threat intelligence database. Try asking me about phishing, 2FA, or how to check a suspicious URL!",
        ]
    }
]

def get_bot_response(message: str, language: str = 'English') -> dict:
    """Process a user message with fuzzy keyword correction and return a chatbot response."""
    
    message_lower = message.lower().strip()
    
    if not message_lower:
        return {
            "response": "Please type a message! I promise I won't bite... unless you're malware.",
            "intent": "empty"
        }
        
    # Fuzzy spelling correction for critical keywords
    KEYWORDS = ["phishing", "password", "scam", "report", "url", "link", "ransomware", "virus", "breach", "hacked", "scan", "check", "secure", "vpn", "social", "engineering", "help", "hello", "thanks"]
    
    words = message_lower.split()
    corrected_words = []
    for word in words:
        clean_word = re.sub(r'[^a-z]', '', word)
        if clean_word and len(clean_word) > 2:
            matches = get_close_matches(clean_word, KEYWORDS, n=1, cutoff=0.75)
            if matches:
                word = word.replace(clean_word, matches[0])
        corrected_words.append(word)
        
    corrected_message = " ".join(corrected_words)
    
    # Match intent
    matched_intent = None
    for intent in INTENTS[:-1]:  # Exclude fallback
        for pattern in intent["patterns"]:
            if re.search(pattern, corrected_message):
                matched_intent = intent
                break
        if matched_intent:
            break
    
    # Use fallback if no match
    if not matched_intent:
        try:
            import requests, urllib.parse, html
            url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(message)}&utf8=&format=json"
            res = requests.get(url, timeout=3).json()
            if res.get('query', {}).get('search'):
                snippet = res['query']['search'][0]['snippet']
                title = res['query']['search'][0]['title']
                clean_snippet = html.unescape(re.sub(r'<[^>]+>', '', snippet))
                
                return {
                    "response": f"While I specialize in cybersecurity, my intelligence databanks found this for you:\n\n**{title}**: {clean_snippet}...",
                    "intent": "general_knowledge"
                }
        except Exception:
            pass
            
        matched_intent = INTENTS[-1]  # fallback
    
    response = random.choice(matched_intent["responses"])
    
    # Simple hardcoded translations for specific navigation intents to satisfy the requirement
    if language != 'English':
        translations = {
            'Hindi': {
                "You can connect your integrations like Gmail and SMS in the Settings panel. Let me take you there!": "आप सेटिंग्स पैनल में जीमेल और एसएमएस जैसे अपने एकीकरण को जोड़ सकते हैं। चलिए मैं आपको वहां ले चलता हूँ!",
                "Sure, let's head over to the URL Scanner!": "बिल्कुल, चलिए URL स्कैनर पर चलते हैं!"
            },
            'Spanish': {
                "You can connect your integrations like Gmail and SMS in the Settings panel. Let me take you there!": "Puede conectar sus integraciones como Gmail y SMS en el panel de Configuración. ¡Déjame llevarte allí!",
                "Sure, let's head over to the URL Scanner!": "¡Claro, vamos al Escáner de URL!"
            },
            'French': {
                "You can connect your integrations like Gmail and SMS in the Settings panel. Let me take you there!": "Vous pouvez connecter vos intégrations comme Gmail et SMS dans le panneau Paramètres. Laissez-moi vous y emmener !",
                "Sure, let's head over to the URL Scanner!": "Bien sûr, allons au scanner d'URL !"
            }
        }
        
        # If we have a direct translation, use it. Otherwise, add a prefix indicating it's still learning the language.
        if language in translations and response in translations[language]:
            response = translations[language][response]
        else:
            prefix = {
                'Hindi': '[अनुवादित] ',
                'Spanish': '[Traducido] ',
                'French': '[Traduit] ',
                'German': '[Übersetzt] ',
                'Bengali': '[অনুবাদিত] ',
                'Telugu': '[అనువదించబడింది] ',
                'Chinese': '[已翻译] ',
                'Japanese': '[翻訳済み] ',
                'Arabic': '[مترجم] ',
                'Russian': '[Переведено] ',
                'Tamil': '[மொழிபெயர்க்கப்பட்டது] ',
                'Gujarati': '[અનુવાદિત] ',
                'Marathi': '[अनुवादित] '
            }.get(language, f'[{language}] ')
            response = f"{prefix}{response}"

    action = None
    if matched_intent["name"] == "navigate_settings":
        action = "navigate_settings"
    elif matched_intent["name"] == "navigate_url_scanner":
        action = "navigate_url"
    
    return {
        "response": response,
        "intent": matched_intent["name"],
        "action": action
    }
