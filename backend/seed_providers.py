"""
Seed OAuth providers including Gmail and WhatsApp.
Run from backend/: python seed_providers.py
"""
import os
import django
import sys

os.environ['DJANGO_SETTINGS_MODULE'] = 'cybersentinel_backend.settings'
sys.stdout.reconfigure(encoding='utf-8')
django.setup()

from api.models import OAuthProvider

PROVIDERS = [
    {
        'name': 'Gmail',
        'category': 'Email',
        'description': 'Connect your Gmail inbox to automatically scan incoming emails for phishing, malware links, spoofed senders, and social engineering attacks in real-time.',
        'default_scopes': 'Read email headers,Detect phishing content,Analyze sender reputation',
        'is_active': True,
    },
    {
        'name': 'Google Drive',
        'category': 'Cloud Storage',
        'description': 'Scan shared files and documents in your Google Drive for embedded malware, suspicious macros, and credential-harvesting content.',
        'default_scopes': 'Read file metadata,Scan document content,Detect malicious macros',
        'is_active': True,
    },
    {
        'name': 'WhatsApp',
        'category': 'Communication',
        'description': 'Link your WhatsApp account to scan incoming messages, detect scam links, impersonation attempts, and financial fraud messages before you engage.',
        'default_scopes': 'Read message text,Scan shared links,Detect sender spoofing',
        'is_active': True,
    },
    {
        'name': 'Microsoft Outlook',
        'category': 'Email',
        'description': 'Monitor your Outlook mailbox for business email compromise (BEC), spear phishing, and invoice fraud attacks targeting corporate accounts.',
        'default_scopes': 'Read email headers,Analyze attachments,Monitor BEC patterns',
        'is_active': True,
    },
    {
        'name': 'Slack',
        'category': 'Productivity',
        'description': 'Protect your Slack workspace by scanning channels and direct messages for phishing links, malicious file shares, and social engineering.',
        'default_scopes': 'Read channel messages,Scan file uploads,Detect malicious links',
        'is_active': True,
    },
    {
        'name': 'Dropbox',
        'category': 'Cloud Storage',
        'description': 'Continuously scan your Dropbox files for ransomware, trojans, embedded scripts, and file-based threats across all shared folders.',
        'default_scopes': 'Read file metadata,Scan file content,Monitor shared folders',
        'is_active': True,
    },
    {
        'name': 'GitHub',
        'category': 'Productivity',
        'description': 'Scan your repositories for exposed API keys, credentials, hardcoded secrets, and dependency vulnerabilities automatically on each commit.',
        'default_scopes': 'Read repository metadata,Scan code for secrets,Monitor dependencies',
        'is_active': True,
    },
    {
        'name': 'Google Workspace',
        'category': 'Identity Providers',
        'description': 'Connect your Google Workspace identity to monitor admin-level access, OAuth grants, and detect privilege escalation or unauthorized app installations.',
        'default_scopes': 'Read admin audit logs,Monitor OAuth grants,Detect privilege changes',
        'is_active': True,
    },
]

created_count = 0
for p in PROVIDERS:
    obj, created = OAuthProvider.objects.get_or_create(
        name=p['name'],
        defaults={
            'category': p['category'],
            'description': p['description'],
            'default_scopes': p['default_scopes'],
            'is_active': p['is_active'],
        }
    )
    if created:
        created_count += 1
        print(f"[+] Created provider: {obj.name} (ID: {obj.id})")
    else:
        # Update existing
        for field, val in p.items():
            setattr(obj, field, val)
        obj.save()
        print(f"[~] Updated provider: {obj.name} (ID: {obj.id})")

print(f"\nDone! {created_count} new providers seeded.")
print(f"Total providers in DB: {OAuthProvider.objects.count()}")
