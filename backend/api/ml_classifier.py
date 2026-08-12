"""Phishing / scam text classifier.

Design notes:

* **Word *and* character n-grams.** Character n-grams catch the obfuscation
  tricks word tokens miss entirely — `paypa1`, `g00gle`, `amaz0n-security`,
  spaced-out `V E R I F Y`. Words alone treat each of those as a brand-new,
  unseen token carrying no weight.

* **Calibrated probabilities.** A bare LogisticRegression's `predict_proba` is
  reported to the user as a percentage risk score, so it needs to actually mean
  something. Cross-validated calibration keeps "82%" closer to an honest 82%.

* **Persisted to disk.** Training on every worker boot wasted startup time and
  meant two workers could disagree if the corpus ever changed between them. The
  fitted pipeline is cached and reloaded, keyed by a hash of the corpus so an
  edit to the training data invalidates the cache automatically.

* **Model score fused with rules.** The learned model generalises; the explicit
  rule overlays catch high-confidence patterns (seed-phrase requests, executable
  attachments, brand-mimicking domains) that a corpus this size cannot cover on
  its own. Neither is trusted alone.
"""

import hashlib
import logging
import re
import threading

import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import FeatureUnion, Pipeline

from .training_data import TRAINING_DATA

logger = logging.getLogger(__name__)

MODEL_VERSION = '2.0'

# ── Rule overlays ───────────────────────────────────────────────────────────

URGENCY_KEYWORDS = [
    'urgent', 'immediately', 'suspension', 'suspend', 'action required',
    'expires today', 'unauthorized', 'locked', 'billing failed', 'final notice',
    'within 24 hours', 'within 12 hours', 'last chance', 'act now', 'do not delay',
    'avoid arrest', 'permanently deleted', 'will be closed',
]

FINANCIAL_KEYWORDS = [
    'gift card', 'won', 'lottery', 'bitcoin', 'crypto', 'rich', 'refund',
    'credit', 'invoice', 'fee', 'charged', 'claim', 'prize', 'payout',
    'wire transfer', 'processing fee', 'guaranteed returns', 'investment',
]

CREDENTIAL_KEYWORDS = [
    'verify now', 'reset your password', 'confirm identity', 'credentials',
    'login', 'signin', 'social security', 'identity verification',
    'seed phrase', 'recovery phrase', 'one-time code', 'otp', 'pin number',
    'routing number', 'card number', 'cvv',
]

#: Extensions that should never arrive unannounced in a message.
DANGEROUS_ATTACHMENTS = [
    '.exe', '.scr', '.bat', '.cmd', '.vbs', '.js', '.jar', '.msi',
    '.docm', '.xlsm', '.htm', '.html', '.iso', '.lnk',
]

#: TLDs that are disproportionately represented in abuse feeds.
SUSPICIOUS_TLDS = [
    '.xyz', '.club', '.info', '.work', '.click', '.cc', '.live', '.top',
    '.buzz', '.rest', '.gq', '.tk', '.ml', '.cf', '.zip', '.mov',
]

#: Brands whose names appearing in a *hyphenated* domain almost always signal
#: impersonation — the real brand serves from its own apex domain.
IMPERSONATED_BRANDS = [
    'paypal', 'netflix', 'apple', 'amazon', 'microsoft', 'google', 'meta',
    'facebook', 'instagram', 'whatsapp', 'coinbase', 'metamask', 'binance',
    'usps', 'ups', 'fedex', 'dhl', 'hmrc', 'irs', 'chase', 'wellsfargo',
]

#: Patterns that are near-conclusive on their own.
HIGH_CONFIDENCE_PATTERNS = [
    (r'\b(seed|recovery|mnemonic)\s+phrase\b', 'Seed Phrase Request',
     'Asks for a crypto wallet recovery phrase. No legitimate service ever does this.'),
    (r'\b12[- ]word\b', 'Seed Phrase Request',
     'Requests a 12-word wallet recovery phrase — always fraudulent.'),
    (r'\bgift\s*cards?\b.{0,60}\b(code|pay|send|purchase|buy)\b', 'Gift Card Payment Demand',
     'Requests payment in gift cards, a hallmark of scams because it is irreversible.'),
    (r'\b(send|transfer|pay).{0,30}\b(bitcoin|btc|crypto|usdt)\b', 'Crypto Payment Demand',
     'Demands payment in cryptocurrency, which cannot be recovered once sent.'),
    (r'\benable\s+macros?\b', 'Macro-Enabled Attachment',
     'Asks you to enable macros, a common malware delivery route.'),
    (r'\bremote\s+access\b', 'Remote Access Request',
     'Requests remote control of your device — a standard tech-support scam step.'),
]


#: Apex domains whose links are evidence *for* legitimacy. Matched strictly on
#: the apex — `amazon.com` matches `www.amazon.com` but never
#: `amazon.com.verify-login.xyz`, which is the whole point of the check.
REPUTABLE_DOMAINS = {
    'amazon.com', 'apple.com', 'google.com', 'microsoft.com', 'office.com',
    'live.com', 'outlook.com', 'paypal.com', 'netflix.com', 'spotify.com',
    'github.com', 'gitlab.com', 'linkedin.com', 'slack.com', 'zoom.us',
    'dropbox.com', 'stripe.com', 'atlassian.com', 'notion.so', 'figma.com',
    'usps.com', 'ups.com', 'fedex.com', 'dhl.com', 'royalmail.com',
    'gov.uk', 'irs.gov', 'nhs.uk', 'wikipedia.org', 'mozilla.org',
}


def _apex_matches(host, domain):
    """True when `host` is `domain` itself or a subdomain of it."""
    host = host.split(':')[0].strip('.')
    return host == domain or host.endswith(f'.{domain}')


#: URL findings that condemn a message on their own, regardless of its wording.
CONCLUSIVE_URL_FINDINGS = {'Brand Impersonation Domain', 'Raw IP Address Link'}

#: Below this model probability the message is treated as confidently
#: legitimate and the merely-suggestive keyword rules are suppressed. Real
#: receipts and delivery notices are full of words like "refund" and "invoice";
#: letting those alone force a Medium verdict trains users to ignore warnings.
CONTEXTUAL_RULE_FLOOR = 0.25

#: Cache of compiled keyword matchers, built once per keyword list.
_KEYWORD_PATTERNS = {}


def _matches_any(lowered, keywords):
    """Word-boundary keyword match.

    Substring matching would fire on fragments inside unrelated words, so every
    keyword is anchored. Multi-word keywords are matched as phrases.
    """
    key = id(keywords)
    pattern = _KEYWORD_PATTERNS.get(key)
    if pattern is None:
        joined = '|'.join(re.escape(kw) for kw in keywords)
        pattern = re.compile(rf'(?<!\w)(?:{joined})(?!\w)')
        _KEYWORD_PATTERNS[key] = pattern
    return bool(pattern.search(lowered))


def _corpus_fingerprint():
    """Stable hash of the corpus, so editing training data busts the cache."""
    digest = hashlib.sha256()
    digest.update(MODEL_VERSION.encode('utf-8'))
    for text, label in TRAINING_DATA:
        digest.update(f'{label}|{text}'.encode('utf-8'))
    return digest.hexdigest()[:16]


def _build_pipeline():
    """Word + character n-gram union feeding a calibrated linear model."""
    features = FeatureUnion([
        ('word', TfidfVectorizer(
            analyzer='word',
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            lowercase=True,
            token_pattern=r'(?u)\b\w+\b',
        )),
        # Character n-grams span word boundaries, so obfuscated and hyphenated
        # brand impersonations still land near their legitimate spellings.
        ('char', TfidfVectorizer(
            analyzer='char_wb',
            ngram_range=(3, 5),
            sublinear_tf=True,
            min_df=1,
            lowercase=True,
        )),
    ])

    base = LogisticRegression(C=4.0, solver='liblinear', class_weight='balanced')

    return Pipeline([
        ('features', features),
        # 5 folds keeps each calibration split large enough to be meaningful on
        # a corpus this size; sigmoid suits the small-sample regime better than
        # isotonic, which overfits when folds are small.
        ('clf', CalibratedClassifierCV(base, method='sigmoid', cv=5)),
    ])


class PhishingClassifier:
    """Thread-safe singleton wrapper around the fitted pipeline."""

    def __init__(self):
        self._lock = threading.Lock()
        self.pipeline = None
        self.trained = False
        self.feature_weights = {}
        self.metrics = {}
        self.fingerprint = _corpus_fingerprint()
        self._load_or_train()

    # ── Lifecycle ──────────────────────────────────────────────────────────

    def _model_path(self):
        try:
            from django.conf import settings
            path = settings.ML_MODEL_PATH
            path.parent.mkdir(parents=True, exist_ok=True)
            return path
        except Exception:
            # Usable outside a configured Django process (scripts, notebooks).
            return None

    def _load_or_train(self):
        path = self._model_path()

        if path and path.exists():
            try:
                import joblib
                payload = joblib.load(path)
                if payload.get('fingerprint') == self.fingerprint:
                    self.pipeline = payload['pipeline']
                    self.feature_weights = payload.get('feature_weights', {})
                    self.metrics = payload.get('metrics', {})
                    self.trained = True
                    logger.info('Loaded cached phishing model (%s)', self.fingerprint)
                    return
                logger.info('Cached model is stale — corpus changed, retraining.')
            except Exception:
                logger.exception('Could not load the cached model; retraining.')

        self.train_model()

    def train_model(self):
        with self._lock:
            texts = [item[0] for item in TRAINING_DATA]
            labels = [item[1] for item in TRAINING_DATA]

            pipeline = _build_pipeline()
            pipeline.fit(texts, labels)

            self.pipeline = pipeline
            self.feature_weights = self._extract_word_weights(texts, labels)
            self.metrics = self._evaluate(texts, labels)
            self.trained = True

            logger.info(
                'Trained phishing model v%s on %d samples (cv accuracy %.3f)',
                MODEL_VERSION, len(texts), self.metrics.get('cv_accuracy', 0.0),
            )
            self._persist()

    def _persist(self):
        path = self._model_path()
        if not path:
            return
        try:
            import joblib
            joblib.dump({
                'fingerprint': self.fingerprint,
                'pipeline': self.pipeline,
                'feature_weights': self.feature_weights,
                'metrics': self.metrics,
                'version': MODEL_VERSION,
            }, path)
            logger.info('Cached phishing model to %s', path)
        except Exception:
            # A read-only filesystem is fine — it just means retraining per boot.
            logger.warning('Could not cache the trained model to disk.', exc_info=True)

    def _evaluate(self, texts, labels):
        """Cross-validated quality figures, surfaced so the number is auditable."""
        try:
            scores = cross_val_score(
                _build_pipeline(), texts, labels, cv=5, scoring='accuracy'
            )
            return {
                'cv_accuracy': float(round(scores.mean(), 4)),
                'cv_std': float(round(scores.std(), 4)),
                'training_samples': len(texts),
                'phishing_samples': int(sum(labels)),
                'legitimate_samples': int(len(labels) - sum(labels)),
            }
        except Exception:
            logger.warning('Cross-validation failed; reporting sample counts only.', exc_info=True)
            return {'training_samples': len(texts)}

    def _extract_word_weights(self, texts, labels):
        """Per-word phishing association, used to explain a verdict.

        The calibrated model wraps its estimators, so a separate lightweight
        word-level model is fitted purely to produce interpretable weights.
        """
        try:
            explainer = Pipeline([
                ('tfidf', TfidfVectorizer(
                    analyzer='word', ngram_range=(1, 1), lowercase=True,
                    token_pattern=r'(?u)\b\w+\b',
                )),
                ('clf', LogisticRegression(C=5.0, solver='liblinear', class_weight='balanced')),
            ])
            explainer.fit(texts, labels)
            names = explainer.named_steps['tfidf'].get_feature_names_out()
            coefs = explainer.named_steps['clf'].coef_[0]
            return {name: float(coef) for name, coef in zip(names, coefs)}
        except Exception:
            logger.exception('Could not build the explanation model.')
            return {}

    # ── Inference ──────────────────────────────────────────────────────────

    def analyze_text(self, text):
        if not text or not isinstance(text, str) or not text.strip():
            return {
                'risk_score': 0.0,
                'risk_level': 'Low',
                'confidence': 0.0,
                'threat_indicators': [],
                'highlighted_words': [],
                'recommendations': ['Please enter text to analyze for security threats.'],
                'model_version': MODEL_VERSION,
            }

        if not self.trained:
            self.train_model()

        lowered = text.lower()

        model_probability = float(self.pipeline.predict_proba([text])[0][1])

        # Rules come in two tiers, and the distinction matters a great deal for
        # false positives. Conclusive rules describe things no legitimate
        # message does (asking for a seed phrase, a bare-IP link, an .exe), so
        # they override the model outright. Contextual rules describe wording
        # that is merely *common* in scams — "refund", "invoice", "urgent" —
        # which real delivery notices and receipts use constantly. Applying
        # those unconditionally pushed every genuine receipt to Medium, so they
        # are suppressed when the model is confident the message is legitimate.
        conclusive_score, conclusive = self._conclusive_rules(text, lowered)
        contextual_score, contextual = self._contextual_rules(text, lowered)

        model_pct = model_probability * 100.0
        blended = max(model_pct, conclusive_score)

        if model_probability >= CONTEXTUAL_RULE_FLOOR:
            blended = max(blended, contextual_score)
            indicators = conclusive + contextual
        else:
            # Confidently legitimate: keep only informational notes.
            indicators = conclusive + [i for i in contextual if i['severity'] == 'Low']

        # Independent signals agreeing is itself evidence.
        if model_probability > 0.5 and max(conclusive_score, contextual_score) > 50:
            blended = min(99.0, blended + 8.0)

        # Domain reputation, applied last. If every link in the message resolves
        # to a well-known apex domain and nothing conclusive fired, the message
        # is very unlikely to be an attack — an attacker cannot host their
        # landing page on amazon.com. This is the only path that lowers a score,
        # and it is deliberately blocked whenever a conclusive rule matched.
        if conclusive_score == 0 and self._all_links_reputable(text):
            blended = min(blended * 0.45, 30.0)
            indicators.append({
                'type': 'Verified Destination Domain',
                'severity': 'Low',
                'description': (
                    'Every link in this message points at a well-known, legitimate '
                    'domain rather than a lookalike.'
                ),
            })

        indicators = self._dedupe(indicators)
        risk_score = float(round(min(99.0, blended), 2))

        if risk_score < 30:
            risk_level = 'Low'
        elif risk_score < 50:
            risk_level = 'Medium'
        elif risk_score < 80:
            risk_level = 'High'
        else:
            risk_level = 'Critical'

        # Distance from the decision boundary, not the risk score itself — a
        # 50% score is a maximally *uncertain* verdict, not a moderate one.
        confidence = float(round(abs(model_probability - 0.5) * 200, 1))

        highlighted = self._highlight(text)

        if risk_score < 30:
            # A low verdict should not be decorated with alarming annotations.
            indicators = [i for i in indicators if i['severity'] == 'Low']
            highlighted = [h for h in highlighted if h['weight'] < 0.8]
            recommendations = [
                'Nothing in this message matches a known scam pattern.',
                'Stay cautious with unexpected requests, even from familiar names.',
                'Keep your system and security software up to date.',
            ]
        else:
            recommendations = self._recommendations(indicators, risk_level)

        if risk_score >= 30 and not indicators:
            indicators.append({
                'type': 'Unusual Language Pattern',
                'severity': 'Medium',
                'description': (
                    'The wording correlates with known social-engineering campaigns even '
                    'though no single classic red flag is present.'
                ),
            })

        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'confidence': confidence,
            'model_probability': round(model_probability * 100, 2),
            'threat_indicators': indicators,
            'highlighted_words': highlighted,
            'recommendations': recommendations,
            'model_version': MODEL_VERSION,
        }

    # ── Rule overlays ──────────────────────────────────────────────────────

    def _conclusive_rules(self, text, lowered):
        """Patterns no legitimate message exhibits. These override the model."""
        indicators = []
        score = 0.0

        for pattern, label, description in HIGH_CONFIDENCE_PATTERNS:
            if re.search(pattern, lowered):
                indicators.append({
                    'type': label, 'severity': 'Critical', 'description': description,
                })
                score = max(score, 92.0)

        if _matches_any(lowered, CREDENTIAL_KEYWORDS):
            indicators.append({
                'type': 'Credential Harvesting',
                'severity': 'Critical',
                'description': (
                    'Directly requests credentials, identity confirmation, or one-time codes.'
                ),
            })
            score = max(score, 78.0)

        if any(ext in lowered for ext in DANGEROUS_ATTACHMENTS):
            indicators.append({
                'type': 'Dangerous Attachment Type',
                'severity': 'Critical',
                'description': (
                    'References an executable or macro-capable file. Do not open it.'
                ),
            })
            score = max(score, 88.0)

        # A link's *destination* is conclusive on its own: a bare-IP target or a
        # brand lookalike domain is fraudulent no matter how calm the wording.
        url_score, url_indicators = self._analyse_urls(text)
        conclusive_urls = [
            i for i in url_indicators if i['type'] in CONCLUSIVE_URL_FINDINGS
        ]
        if conclusive_urls:
            indicators.extend(conclusive_urls)
            score = max(score, url_score)

        return score, indicators

    def _contextual_rules(self, text, lowered):
        """Wording that is suggestive but appears in legitimate mail too.

        Only consulted when the model has not already judged the message
        confidently legitimate.
        """
        indicators = []
        score = 0.0

        if _matches_any(lowered, URGENCY_KEYWORDS):
            indicators.append({
                'type': 'Manufactured Urgency',
                'severity': 'High',
                'description': (
                    'Uses deadlines or threats of loss to rush you past your own judgement.'
                ),
            })
            score = max(score, 58.0)

        if _matches_any(lowered, FINANCIAL_KEYWORDS):
            indicators.append({
                'type': 'Financial Bait',
                'severity': 'Medium',
                'description': (
                    'Dangles a refund, prize, invoice, or investment return as the hook.'
                ),
            })
            score = max(score, 42.0)

        # Only the non-conclusive URL findings belong in this tier; the
        # conclusive ones were already claimed by `_conclusive_rules`.
        url_score, url_indicators = self._analyse_urls(text)
        soft_urls = [i for i in url_indicators if i['type'] not in CONCLUSIVE_URL_FINDINGS]
        if soft_urls:
            indicators.extend(soft_urls)
            score = max(score, min(url_score, 68.0))

        return score, indicators

    @staticmethod
    def _all_links_reputable(text):
        """True when the message contains links and every one is on a known domain."""
        hosts = re.findall(r'https?://([^\s/]+)', text.lower())
        if not hosts:
            return False
        return all(
            any(_apex_matches(host, domain) for domain in REPUTABLE_DOMAINS)
            for host in hosts
        )

    def _analyse_urls(self, text):
        """Returns (score, indicators) for every link in the message."""
        indicators = []
        urls = re.findall(r'https?://([^\s/]+)', text.lower())
        if not urls:
            return 0.0, indicators

        score = 12.0
        suspicious_tld = False
        brand_mimicry = False
        ip_literal = False

        for host in urls:
            if any(host.endswith(tld) for tld in SUSPICIOUS_TLDS):
                suspicious_tld = True
            if re.match(r'^\d{1,3}(\.\d{1,3}){3}$', host):
                ip_literal = True
            # A brand name inside a hyphenated or multi-part host is the classic
            # lookalike shape: `apple-verification-support.com`, never apple.com.
            for brand in IMPERSONATED_BRANDS:
                if brand in host and not host.split(':')[0].endswith(f'{brand}.com'):
                    brand_mimicry = True
                    break

        if brand_mimicry:
            indicators.append({
                'type': 'Brand Impersonation Domain',
                'severity': 'Critical',
                'description': (
                    'A link mimics a well-known brand without being served from that '
                    "brand's real domain."
                ),
            })
            score = max(score, 90.0)

        if ip_literal:
            indicators.append({
                'type': 'Raw IP Address Link',
                'severity': 'Critical',
                'description': (
                    'A link points at a bare IP address instead of a domain name — '
                    'legitimate services do not do this.'
                ),
            })
            score = max(score, 85.0)

        if suspicious_tld:
            indicators.append({
                'type': 'High-Abuse Domain Extension',
                'severity': 'High',
                'description': (
                    'The destination uses a domain extension heavily over-represented '
                    'in abuse reports.'
                ),
            })
            score = max(score, 68.0)

        if not (brand_mimicry or ip_literal or suspicious_tld):
            indicators.append({
                'type': 'Hyperlink Present',
                'severity': 'Low',
                'description': 'Contains clickable links. Confirm the destination before clicking.',
            })

        return score, indicators

    @staticmethod
    def _dedupe(indicators):
        seen = set()
        unique = []
        for indicator in indicators:
            if indicator['type'] in seen:
                continue
            seen.add(indicator['type'])
            unique.append(indicator)
        # Most severe first, so the UI leads with what matters.
        rank = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}
        unique.sort(key=lambda i: rank.get(i['severity'], 9))
        return unique

    def _highlight(self, text):
        """Words that pushed the verdict toward 'phishing', for the UI overlay."""
        highlighted = []
        seen = set()

        for word in re.findall(r'\b\w+\b', text):
            lowered = word.lower()
            if lowered in seen:
                continue
            seen.add(lowered)

            weight = self.feature_weights.get(lowered, 0.0)
            if lowered in URGENCY_KEYWORDS:
                weight += 1.5
            if lowered in FINANCIAL_KEYWORDS:
                weight += 1.2
            if lowered in CREDENTIAL_KEYWORDS:
                weight += 2.0

            if weight <= 0.3:
                continue

            if weight > 1.5:
                severity = 'critical'
                reason = 'Strong phishing association — prompts a sensitive action.'
            elif weight > 0.8:
                severity = 'high'
                reason = 'Scam-associated wording signalling urgency or financial gain.'
            else:
                severity = 'medium'
                reason = 'Suspicious wording commonly used in social engineering.'

            highlighted.append({
                'word': word,
                'severity': severity,
                'weight': float(round(weight, 2)),
                'reason': reason,
            })

        highlighted.sort(key=lambda h: h['weight'], reverse=True)
        return highlighted[:40]

    @staticmethod
    def _recommendations(indicators, risk_level):
        """Advice matched to what was actually found, not a fixed list."""
        types = {indicator['type'] for indicator in indicators}
        advice = []

        if risk_level == 'Critical':
            advice.append('Do not respond, click, or open anything in this message.')
        else:
            advice.append('Do not click any links in this message until you have verified it.')

        if 'Credential Harvesting' in types or 'Seed Phrase Request' in types:
            advice.append(
                'Never enter passwords, one-time codes, or recovery phrases from a link in a message.'
            )
        if 'Brand Impersonation Domain' in types or 'Raw IP Address Link' in types:
            advice.append(
                'Reach the company by typing their address yourself, not by following this link.'
            )
        if 'Dangerous Attachment Type' in types:
            advice.append('Do not open the attachment. Delete it and empty your trash.')
        if 'Gift Card Payment Demand' in types or 'Crypto Payment Demand' in types:
            advice.append(
                'Gift card and crypto payments are unrecoverable. No real organisation requests them.'
            )
        if 'Manufactured Urgency' in types:
            advice.append('The deadline is the pressure tactic. Take the time to verify independently.')

        advice.append('Verify the sender through a channel you already trust.')
        advice.append('Report this message to your security team or forward it to your provider.')
        return advice


# Singleton instance shared across the process.
classifier = PhishingClassifier()
