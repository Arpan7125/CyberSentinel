"""Redaction helpers for personal data shown in the admin console.

Encryption at rest and masking in the console solve two different problems, and
neither substitutes for the other:

* Encryption (see `fields.py`) protects against someone who obtains the
  database — a dump, a stolen backup, a misconfigured snapshot.
* Masking protects against the person who is legitimately signed in as an
  administrator. Running a support console should not mean idly browsing every
  customer's email address and phone number.

Masking is applied on the way out of the server, never in the browser. A React
component that hides a value it was already sent is decoration: the plaintext is
still sitting in the network response, in memory, and in any logging proxy along
the way. If the admin genuinely needs the real value they ask for it explicitly
through the reveal endpoint, which records who looked and at what.
"""


#: The redaction glyph, as a named constant rather than an inline escape.
#: A backslash inside an f-string expression is a SyntaxError before Python
#: 3.12 (PEP 701), and the deployment target runs 3.11 — writing the escape
#: directly inside the braces below took the whole build down.
BULLET = '•'


def mask_email(value):
    """`arpan.mukherjee@example.com` -> `arp•••@example.com`.

    Keeps enough to recognise an address you already know, without handing over
    one you don't. The domain stays intact because it is rarely the sensitive
    half and admins need it to spot bulk signups from a single domain.
    """
    email = (value or '').strip()
    if not email or '@' not in email:
        return email

    local, _, domain = email.partition('@')
    if len(local) <= 3:
        # Too short to keep a prefix without effectively showing the whole thing.
        shown = local[:1]
    else:
        shown = local[:3]

    return f"{shown}{BULLET * 3}@{domain}"


def mask_phone(value):
    """`+14155552671` -> `+1••••••2671`, keeping the country hint and last four.

    The last four digits are what a support agent reads back to confirm they
    have the right person, so keeping them preserves the legitimate use while
    dropping the part that makes the number dialable.
    """
    phone = (value or '').strip()
    if not phone:
        return phone

    digits = [c for c in phone if c.isdigit()]
    if len(digits) <= 4:
        return BULLET * len(digits)

    prefix = '+' if phone.startswith('+') else ''
    lead = digits[0] if prefix else ''
    tail = ''.join(digits[-4:])
    hidden = len(digits) - len(tail) - (1 if lead else 0)

    bullets = BULLET * max(hidden, 1)

    return f"{prefix}{lead}{bullets}{tail}"
