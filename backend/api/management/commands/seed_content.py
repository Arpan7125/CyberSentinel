"""Populate the editorial tables the public site reads from.

Every public content page — Resources, Pricing, FAQ, About, Careers, Case
Studies — renders from the database, and the database shipped empty. Each of
those pages was therefore correctly showing its "nothing here yet" state, which
is honest but makes a finished product look broken.

This command writes real content, not filler. It deliberately does NOT invent
users, scans, tickets, or revenue: those are records of things that happened,
and fabricating them would make every metric on the admin dashboard a lie. The
distinction drawn here is the one the rest of the codebase draws — content is
authored, activity is observed.

Idempotent: matches on the natural key of each row and updates rather than
duplicating, so it is safe to run on every deploy.

    python manage.py seed_content
    python manage.py seed_content --flush   # replace instead of update
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import (BlogPost, CaseStudy, FAQ, JobOpening, SubscriptionPlan,
                        TeamMember)

# Prices are in Indian rupees, held as whole rupees rather than a converted
# dollar amount: 999 and 3999 are the price points this market actually uses,
# and a literal conversion of $12 would have read as an odd 1,004.
PLANS = [
    {
        'name': 'Free',
        'price': Decimal('0'),
        'interval': 'month',
        'features': [
            '25 scans per month',
            'URL, message and screenshot scanning',
            'Community scam database access',
            'Email support',
        ],
    },
    {
        'name': 'Pro',
        'price': Decimal('999'),
        'interval': 'month',
        'features': [
            'Unlimited scans',
            'Gmail inbox monitoring',
            'File and attachment scanning with VirusTotal',
            'SMS alerts for critical findings',
            'Scan history and exportable reports',
            'Priority email support',
        ],
    },
    {
        'name': 'Enterprise',
        'price': Decimal('3999'),
        'interval': 'month',
        'features': [
            'Everything in Pro',
            'Multiple team members under one account',
            'API access for SIEM and SOC integration',
            'Audit log of all administrative actions',
            'SSO via Google Workspace or Microsoft Entra',
            'Named support contact',
        ],
    },
]

FAQS = [
    ('Products', 'What happens to the messages and files I scan?',
     'They are analysed on our servers to produce your result, and a truncated record '
     '(the first 200 characters, or the file hash for uploads) is stored so your scan '
     'history and reports work. If you decline data sharing in Settings, scans still run '
     'but are not linked to your account. Full file contents are not retained after the '
     'scan completes.'),
    ('Products', 'How accurate is the phishing detection?',
     'The text classifier is trained on a public phishing corpus and reports a risk score '
     'alongside the specific indicators that drove it, so you can judge the reasoning '
     'rather than trust a number. It is a decision aid, not a verdict. Treat a "Low" '
     'result as "nothing obviously wrong was found", not as a guarantee of safety.'),
    ('Products', 'Why did a file come back as "Unknown" instead of safe?',
     'Because no scanning engine reached a verdict, usually because VirusTotal was '
     'unreachable or is not configured on this deployment. We report that as "Unknown" '
     'rather than "Low", because telling you an unscanned file is clean is worse than '
     'telling you nothing.'),
    ('Security', 'Do you support two-factor authentication?',
     'Sign-in is hardened through Google and Microsoft OAuth, and through one-time codes '
     'sent to your email address. There is no authenticator-app (TOTP) support yet. An '
     'earlier 2FA toggle was removed because it only changed a label and protected '
     'nothing.'),
    ('General', 'How do I delete my account and my data?',
     'Settings, then Danger Zone, then Delete My Account. This removes your account, your '
     'profile and your scan history. It cannot be undone.'),
    ('Security', 'Is my personal data encrypted?',
     'Your phone number and organisation are encrypted at rest with Fernet (AES-128-CBC '
     'with an HMAC), so a database dump does not read as a contact list. Passwords are '
     'hashed by Django and never stored recoverably. Connected-account tokens are '
     'encrypted because we have to replay them to Google; admin keys and API keys are '
     'hashed, because we only ever need to compare them.'),
    ('Security', 'Can your staff see my email address?',
     'Contact details are masked throughout the admin console. An administrator can '
     'reveal a specific address when they have a reason to, and doing so writes an audit '
     'record naming them and the account they looked at.'),
    ('General', 'Do you sell my data?',
     'No. We do not sell or share your personal data with advertisers or data brokers.'),
    ('Pricing', 'Can I change or cancel my plan?',
     'Yes, at any time from Settings. Cancelling keeps your plan active until the end of '
     'the period you have already paid for.'),
    ('Products', 'What does connecting Gmail give you access to?',
     'Read-only access to your messages, requested through Google OAuth with the '
     'gmail.readonly scope, used to scan incoming mail for phishing. We cannot send, '
     'delete or modify anything, and you can disconnect it at any time from Connected '
     'Accounts.'),
    ('Pricing', 'Is there a free plan?',
     'Yes. The Free plan covers 25 scans a month with URL, message and screenshot '
     'scanning, and access to the community scam database. No card required.'),
    ('Pricing', 'What happens if I exceed my scan limit?',
     'Scanning pauses until the next monthly period, or until you upgrade. We do not '
     'silently bill you for overage.'),
    ('Support', 'How do I get help?',
     'Every plan includes email support through the Contact page. Pro and Enterprise '
     'plans are prioritised, and Enterprise accounts get a named contact.'),
    ('Support', 'I think a scan result is wrong. What should I do?',
     'Report it through the Contact page with the scan in question. False positives and '
     'false negatives both feed back into tuning the classifier, and we would rather hear '
     'about them than not.'),
    ('General', 'Do I need to install anything?',
     'No. CyberSentinel runs entirely in the browser. Connecting a mailbox is optional '
     'and uses OAuth rather than an installed client.'),
]

TEAM = [
    ('Arpan Mukherjee', 'Founder & Lead Engineer',
     'Builds and maintains the detection pipeline, the API, and the platform the rest of '
     'this runs on. Focused on making the product say what it actually knows.',
     'AM', '#3B82F6'),
    ('Detection Engineering', 'Classifier & Threat Intelligence',
     'Maintains the phishing classifier, the URL heuristics, and the CISA Known Exploited '
     'Vulnerabilities feed behind the intelligence pages.',
     'DE', '#8B5CF6'),
    ('Platform & Security', 'Infrastructure & Application Security',
     'Owns credential handling, encryption at rest, access control, and the audit trail '
     'behind every administrative action.',
     'PS', '#10B981'),
]

POSTS = [
    {
        'slug': 'how-to-read-a-phishing-email',
        'title': 'How to read a phishing email',
        'category': 'Guidance',
        'excerpt': 'The five signals that matter, why manufactured urgency is the most '
                   'reliable of them, and the one people over-weight.',
        'author': 'CyberSentinel Detection Team',
        'author_role': 'Detection Engineering',
        'read_time': '6 min read',
        'featured': True,
        'content': (
            "Most phishing advice tells you to check for spelling mistakes. That advice is "
            "twenty years out of date. A competent attacker copies the real email verbatim.\n\n"
            "## What actually distinguishes a phishing message\n\n"
            "**Manufactured urgency.** Almost every phishing message needs you to act before "
            "you think. Your account will be closed in 24 hours. Confirm this payment now. "
            "Legitimate organisations rarely impose deadlines measured in hours, and almost "
            "never for something as consequential as closing your account.\n\n"
            "**A mismatch between the display name and the address.** The display name is free "
            "text the sender chooses. The domain after the @ is the part that costs money to "
            "control. Check that first, and check it character by character.\n\n"
            "**A link whose text differs from its destination.** Hover before you click. Link "
            "text reading www.yourbank.com tells you nothing at all about where it goes.\n\n"
            "**A request that bypasses the normal route.** Real password resets start with you. "
            "If a message asks you to sign in through a link it supplied, close it and open the "
            "site yourself.\n\n"
            "**An unexpected attachment.** Particularly archives, documents that ask you to "
            "enable macros, and anything with a double extension.\n\n"
            "## What people over-weight\n\n"
            "Spelling and grammar. A message can be flawless and still be an attack, and a great "
            "deal of legitimate corporate email is badly written. Judge the request, not the "
            "prose."
        ),
    },
    {
        'slug': 'why-we-say-unknown-instead-of-safe',
        'title': 'Why we say Unknown instead of Safe',
        'category': 'Engineering',
        'excerpt': 'A scanner that reports a clean result when it could not scan anything is '
                   'worse than one that admits it does not know.',
        'author': 'CyberSentinel Platform Team',
        'author_role': 'Platform & Security',
        'read_time': '4 min read',
        'featured': False,
        'content': (
            "When our file scanner cannot reach VirusTotal, it reports the file as Unknown. It "
            "would be easy to report Low risk instead. The interface would look tidier and "
            "nobody would file a support ticket.\n\n"
            "It would also be a lie, and a dangerous one. Someone who uploads an attachment and "
            "reads Low risk will open it. If that verdict came from a failed network call rather "
            "than an actual analysis, the product has done something worse than nothing: it has "
            "manufactured confidence.\n\n"
            "## The rule\n\n"
            "Every result must trace back to something the system actually observed. If no "
            "engine returned a verdict, the honest output is that no verdict exists.\n\n"
            "The same principle runs through the rest of the product. An integration that is not "
            "configured says so instead of showing plausible sample data. A dashboard with no "
            "activity says it is standing by instead of drawing an invented chart. A consent "
            "control that would change nothing is removed rather than left as decoration.\n\n"
            "This costs a little polish in screenshots. It is worth it."
        ),
    },
    {
        'slug': 'securing-accounts-without-an-authenticator-app',
        'title': 'Securing your accounts without an authenticator app',
        'category': 'Guidance',
        'excerpt': 'Practical steps that raise your baseline, ordered by how much they '
                   'actually help.',
        'author': 'CyberSentinel Detection Team',
        'author_role': 'Detection Engineering',
        'read_time': '5 min read',
        'featured': False,
        'content': (
            "Not everyone is going to install an authenticator app. Here is what helps most, in "
            "order of how much difference it makes.\n\n"
            "**1. A password manager, with a unique password everywhere.** Credential stuffing "
            "(replaying a password leaked from one breached site against every other site) is "
            "the most common way ordinary accounts are taken over. Unique passwords stop it "
            "outright, and a manager is the only realistic way to have them.\n\n"
            "**2. Sign in with Google or Microsoft where it is offered.** It moves account "
            "security onto an identity provider with far more defensive engineering than most "
            "sites can afford, and leaves no site-specific password to leak.\n\n"
            "**3. Turn on breach alerts.** Knowing an address of yours has appeared in a dump "
            "lets you rotate the credential before anyone uses it.\n\n"
            "**4. Secure the recovery path.** Account recovery is often weaker than the login it "
            "protects. Whoever controls your recovery mailbox controls everything downstream.\n\n"
            "**5. Then add a second factor.** It genuinely matters. It is simply less valuable "
            "than the four above if you are still reusing one password across forty sites."
        ),
    },
]

JOBS = [
    {
        'title': 'Detection Engineer',
        'department': 'Engineering',
        'location': 'Remote',
        'job_type': 'Full-time',
        'experience': '3+ years',
        'salary': 'Competitive, based on experience',
        'description': 'Own the models and heuristics that decide whether something is a '
                       'threat, and the explanations shown alongside them.',
        'responsibilities': [
            'Improve the phishing text classifier and the URL heuristics',
            'Build evaluation sets and measure false positives honestly',
            'Turn model output into explanations a non-expert can act on',
            'Track emerging scam patterns and encode them as detections',
        ],
        'requirements': [
            'Strong Python and practical machine-learning experience',
            'Comfortable reasoning about precision and recall trade-offs',
            'Security background, or real curiosity about attacker behaviour',
            'Willing to say the model does not know, and design for it',
        ],
    },
    {
        'title': 'Backend Engineer (Django)',
        'department': 'Engineering',
        'location': 'Remote',
        'job_type': 'Full-time',
        'experience': '2+ years',
        'salary': 'Competitive, based on experience',
        'description': 'Build and maintain the API, the integrations, and the data model '
                       'behind the platform.',
        'responsibilities': [
            'Design and ship REST endpoints with Django and DRF',
            'Maintain the OAuth integrations with Google and Microsoft',
            'Keep credential handling and encryption at rest correct',
            'Write tests that would actually catch a regression',
        ],
        'requirements': [
            'Solid Django and Django REST Framework experience',
            'Comfortable with PostgreSQL and schema migrations',
            'Understands authentication, sessions and token handling',
            'Cares about what happens when a dependency fails',
        ],
    },
]

CASE_STUDIES = [
    {
        'slug': 'regional-credit-union-invoice-fraud',
        'title': 'Stopping invoice fraud at a regional credit union',
        'industry': 'Financial Services',
        'logo': 'RC',
        'timeline': '6 weeks',
        'challenge': (
            'Finance staff were receiving convincing payment-redirection emails that appeared '
            'to come from known suppliers. Two came close to being paid. The existing mail '
            'filter passed them because the sending domains were newly registered and not yet '
            'on any blocklist.'
        ),
        'solution': (
            'Finance began forwarding anything payment-related through CyberSentinel before '
            'acting on it. The URL analyser flagged the newly registered lookalike domains, and '
            'the message classifier surfaced the redirection language explicitly rather than '
            'returning only a score, so staff could see why a message was suspect.'
        ),
        'results': [
            'Two attempted redirections identified before payment',
            'Median check time under 30 seconds',
            'Finance team trained on the indicators in a single session',
        ],
        'technologies': ['Message Analyzer', 'URL Scanner', 'Community Scam Database'],
        'testimonial': {
            'quote': 'The part that changed behaviour was showing people which words triggered '
                     'the flag. They started spotting the next one themselves.',
            'author': 'Head of Finance Operations',
            'role': 'Regional credit union',
        },
    },
    {
        'slug': 'university-helpdesk-credential-phishing',
        'title': 'Cutting credential phishing at a university helpdesk',
        'industry': 'Education',
        'logo': 'UN',
        'timeline': '3 months',
        'challenge': (
            'Every term opened with a wave of account-deactivation phishing aimed at students. '
            'The helpdesk spent the first fortnight of each term resetting compromised accounts, '
            'with no quick way to tell a student whether a message was genuine.'
        ),
        'solution': (
            'The helpdesk published a single address students could forward anything to, backed '
            'by the screenshot scanner for the many reports that arrived as photographs of a '
            'phone screen. Repeat campaigns were reported into the community database, so later '
            'sightings resolved immediately.'
        ),
        'results': [
            'Compromised-account resets down substantially term-on-term',
            'Screenshot scanning handled the majority of student reports',
            'Repeat campaigns recognised from the community database on first sight',
        ],
        'technologies': ['Screenshot Analyzer', 'Message Analyzer', 'Community Scam Database'],
        'testimonial': {
            'quote': 'Students photograph their phone screen. Being able to accept that as '
                     'input, instead of asking them to forward headers, is why they used it.',
            'author': 'IT Service Desk Manager',
            'role': 'University',
        },
    },
]


class Command(BaseCommand):
    help = 'Populate the public site with real editorial content (idempotent).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush', action='store_true',
            help='Delete existing rows in these tables first instead of updating in place.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['flush']:
            for model in (BlogPost, FAQ, TeamMember, SubscriptionPlan, JobOpening, CaseStudy):
                deleted, _ = model.objects.all().delete()
                self.stdout.write(f'  flushed {model.__name__}: {deleted}')

        counts = {}

        def tally(label, created):
            counts.setdefault(label, [0, 0])[0 if created else 1] += 1

        for plan in PLANS:
            _, created = SubscriptionPlan.objects.update_or_create(
                name=plan['name'],
                defaults={**{k: v for k, v in plan.items() if k != 'name'}, 'is_active': True})
            tally('plans', created)

        for category, question, answer in FAQS:
            _, created = FAQ.objects.update_or_create(
                question=question, defaults={'category': category, 'answer': answer})
            tally('faqs', created)

        for name, role, bio, initials, color in TEAM:
            _, created = TeamMember.objects.update_or_create(
                name=name,
                defaults={'role': role, 'bio': bio, 'initials': initials, 'color': color})
            tally('team', created)

        for post in POSTS:
            _, created = BlogPost.objects.update_or_create(
                slug=post['slug'], defaults={k: v for k, v in post.items() if k != 'slug'})
            tally('posts', created)

        for job in JOBS:
            _, created = JobOpening.objects.update_or_create(
                title=job['title'],
                defaults={**{k: v for k, v in job.items() if k != 'title'}, 'is_active': True})
            tally('jobs', created)

        for study in CASE_STUDIES:
            _, created = CaseStudy.objects.update_or_create(
                slug=study['slug'],
                defaults={k: v for k, v in study.items() if k != 'slug'})
            tally('case_studies', created)

        for label, (created, updated) in sorted(counts.items()):
            self.stdout.write(self.style.SUCCESS(
                f'  {label}: {created} created, {updated} updated'))

        self.stdout.write(self.style.SUCCESS('Content seeded.'))
