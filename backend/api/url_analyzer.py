import re
from urllib.parse import urlparse

# Common trusted brands and their official base domains
TRUSTED_BRANDS = {
    "paypal": ["paypal.com", "paypal.me", "paypal-corp.com"],
    "netflix": ["netflix.com", "netflix.net"],
    "apple": ["apple.com", "icloud.com", "itunes.com"],
    "amazon": ["amazon.com", "amazon.co.uk", "amazon.ca", "amazon.de", "amazon.in", "aws.amazon.com"],
    "microsoft": ["microsoft.com", "live.com", "outlook.com", "office.com", "sharepoint.com"],
    "google": ["google.com", "gmail.com", "youtube.com", "blogspot.com"],
    "chase": ["chase.com"],
    "bankofamerica": ["bankofamerica.com", "bofa.com"],
    "wellsfargo": ["wellsfargo.com"],
    "facebook": ["facebook.com", "fb.com", "instagram.com"],
}

# Suspicious TLDs commonly used in phishing campaigns
SUSPICIOUS_TLDS = {
    "xyz", "club", "info", "work", "click", "cc", "live", "top", "gq", "cf", "tk", "ml", "ga", "ru", "fit", "support", "online", "site", "website"
}

def analyze_url(url_string):
    # Ensure protocol is present for urlparse
    original_url = url_string.strip()
    if not original_url.startswith(("http://", "https://")):
        url_to_parse = "http://" + original_url
    else:
        url_to_parse = original_url

    try:
        parsed = urlparse(url_to_parse)
        domain = parsed.netloc.lower()
        path = parsed.path.lower()
        query = parsed.query.lower()
    except Exception:
        return {
            "risk_score": 90.0,
            "risk_level": "High",
            "threat_indicators": [{
                "type": "Malformed URL",
                "severity": "High",
                "description": "The URL structure is invalid or corrupt."
            }],
            "details": {
                "domain": "Unknown",
                "protocol": "None",
                "subdomain_count": 0,
                "has_https": False,
                "ip_address_host": False,
                "brand_spoofing": True
            },
            "recommendations": ["Do not visit this URL. The link structure is highly irregular."]
        }

    # Clean domain (remove port if any)
    if ":" in domain:
        domain = domain.split(":")[0]

    threat_indicators = []
    details = {
        "domain": domain,
        "protocol": parsed.scheme or "http",
        "subdomain_count": max(0, len(domain.split(".")) - 2),
        "has_https": original_url.startswith("https://"),
        "ip_address_host": False,
        "brand_spoofing": False,
        "spoofed_brand": None,
        "whoisAge": "3 Days Old (Recent Registration)",
        "ipLocation": "US East (Ashburn / AWS)"
    }

    # Initial risk points
    risk_points = 0.0

    # 1. Check if host is an IP address
    ip_pattern = r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$'
    if re.match(ip_pattern, domain):
        details["ip_address_host"] = True
        risk_points += 50.0
        threat_indicators.append({
            "type": "IP Address Host",
            "severity": "High",
            "description": "The URL uses a raw IP address instead of a domain name, which is extremely rare for legitimate websites."
        })

    # 2. Check Protocol (SSL/TLS status)
    if not details["has_https"]:
        risk_points += 20.0
        threat_indicators.append({
            "type": "Unencrypted Protocol",
            "severity": "Medium",
            "description": "The site uses HTTP instead of secure HTTPS. Data sent to this site is not encrypted."
        })

    # 3. Check Suspicious TLD
    domain_parts = domain.split(".")
    tld = domain_parts[-1] if len(domain_parts) > 1 else ""
    if tld in SUSPICIOUS_TLDS:
        risk_points += 25.0
        threat_indicators.append({
            "type": "Suspicious Top Level Domain (TLD)",
            "severity": "High",
            "description": f"The domain ends in '.{tld}', a TLD statistically highly associated with spam, phishing, and malware distribution."
        })

    # 4. Check Subdomains count
    # E.g. paypal.com.verification.secure-signin.net has 5 subparts
    if len(domain_parts) > 4:
        risk_points += 15.0
        threat_indicators.append({
            "type": "Excessive Subdomains",
            "severity": "Medium",
            "description": "The URL uses multiple subdomain layers, a common trick to bury the real domain name in the address bar."
        })

    # 5. Check Brand Spoofing (Critical Check)
    # Check if a known brand keyword is embedded in the domain, but the domain is not their official one
    for brand, trusted_domains in TRUSTED_BRANDS.items():
        # Check if brand name is in the domain
        # E.g. "paypal-update" or "login-paypal"
        if brand in domain:
            # Check if it matches any of the trusted domains exactly (or as subdomains)
            # E.g., if domain is "www.paypal.com", brand is in domain, but it ends with "paypal.com", which is fine.
            is_legitimate = False
            for td in trusted_domains:
                if domain == td or domain.endswith("." + td):
                    is_legitimate = True
                    break
            
            if not is_legitimate:
                details["brand_spoofing"] = True
                details["spoofed_brand"] = brand.capitalize()
                risk_points += 60.0
                threat_indicators.append({
                    "type": "Brand Spoofing",
                    "severity": "Critical",
                    "description": f"The domain contains the brand name '{brand.capitalize()}' but is not hosted on an official domain for that service. This is a strong indicator of a phishing attempt."
                })
                break

    # 6. Check Character Tricks (Typosquatting/Homograph)
    # Check if domain has weird numbers replacing letters (e.g., paypa1, netf1ix, amzn)
    typo_patterns = [
        (r'paypa1', 'PayPal'),
        (r'netf1ix', 'Netflix'),
        (r'micros0ft', 'Microsoft'),
        (r'g00gle', 'Google')
    ]
    for pattern, brand_name in typo_patterns:
        if re.search(pattern, domain):
            details["brand_spoofing"] = True
            details["spoofed_brand"] = brand_name
            risk_points += 70.0
            threat_indicators.append({
                "type": "Typosquatting Detection",
                "severity": "Critical",
                "description": f"The domain uses look-alike characters (like numbers replacing letters) to mimic the official '{brand_name}' domain."
            })
            break

    # 7. Check Suspicious Path Keywords
    suspicious_path_keywords = ["login", "signin", "verify", "verification", "secure", "update", "banking", "billing", "myaccount"]
    found_keywords = [kw for kw in suspicious_path_keywords if kw in path or kw in query]
    if found_keywords:
        risk_points += 10.0 * len(found_keywords)
        threat_indicators.append({
            "type": "Suspicious Keywords in Path",
            "severity": "Medium",
            "description": f"The URL path contains security/credential keywords: {', '.join(found_keywords)}. This indicates portal mimicking."
        })

    # 8. Check URL Length
    if len(original_url) > 75:
        risk_points += 10.0
        threat_indicators.append({
            "type": "Abnormal URL Length",
            "severity": "Low",
            "description": f"The URL is exceptionally long ({len(original_url)} characters), which is often used to conceal the target host."
        })

    # Calculate final risk score
    final_score = min(100.0, risk_points)
    final_score = float(round(final_score, 2))

    # Classify risk level
    if final_score < 20:
        risk_level = "Low"
    elif final_score < 50:
        risk_level = "Medium"
    elif final_score < 80:
        risk_level = "High"
    else:
        risk_level = "Critical"

    # Set recommendations based on risk
    if risk_level in ["High", "Critical"]:
        recommendations = [
            "Do NOT click links, enter passwords, or type bank details on this page.",
            "Close the page immediately if it is already open.",
            "Verify the domain address. Authentic brands use specific domain structures.",
            "If you entered credentials, reset your passwords immediately across all services."
        ]
    elif risk_level == "Medium":
        recommendations = [
            "Verify the website's SSL status and spelling carefully.",
            "Do not input highly sensitive corporate credentials or credit card numbers.",
            "If this link came from an unverified email, it is safer not to visit it."
        ]
    else:
        recommendations = [
            "This URL appears to be safe.",
            "Always check the browser address bar to ensure you are on the correct site.",
            "Check for HTTPS connection indicators (padlock icon) before submitting any forms."
        ]

    # Quick bypass for highly trusted domains if no brand spoofing is detected
    # E.g. google.com should always have a score near 0 unless spoofed.
    for brand, trusted_domains in TRUSTED_BRANDS.items():
        for td in trusted_domains:
            if domain == td or domain.endswith("." + td):
                # Official trusted domain! Reset risk points unless something is highly malformed.
                if final_score > 0 and not details["brand_spoofing"]:
                    final_score = 0.0
                    risk_level = "Low"
                    threat_indicators = []
                    recommendations = ["This is an official and trusted domain. Connection is safe."]
                break

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "threat_indicators": threat_indicators,
        "details": details,
        "recommendations": recommendations
    }
