from django.db import models
from django.contrib.auth.models import User

# ── 1. SCANNING LOGS AND DATA MODEL ───────────────────────────────────────────

class ScanLog(models.Model):
    SCAN_TYPES = (
        ('TEXT', 'Email/SMS Text'),
        ('URL', 'URL Link'),
        ('SCREENSHOT', 'Screenshot OCR'),
    )
    
    RISK_LEVELS = (
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    )

    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='scan_logs'
    )
    scan_type = models.CharField(max_length=20, choices=SCAN_TYPES)
    input_content = models.TextField()
    sender = models.CharField(max_length=255, blank=True, default='')
    subject = models.CharField(max_length=255, blank=True, default='')
    risk_score = models.FloatField()
    risk_level = models.CharField(max_length=15, choices=RISK_LEVELS)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Scan Log"
        verbose_name_plural = "Scan Logs"

    def __str__(self):
        return f"{self.scan_type} | {self.risk_level} ({self.risk_score}%) | {self.created_at.strftime('%Y-%m-%d %H:%M')}"


# ── 2. EDUCATIONAL QUIZ SCHEMAS ───────────────────────────────────────────────

class QuizQuestion(models.Model):
    scenario_name = models.CharField(max_length=100)
    sender = models.CharField(max_length=150, blank=True, null=True)
    subject = models.CharField(max_length=200, blank=True, null=True)
    body = models.TextField()
    is_phishing = models.BooleanField(default=True)
    explanation = models.TextField()
    clues = models.JSONField(default=list, help_text="List of red flag strings")

    class Meta:
        verbose_name = "Quiz Question"
        verbose_name_plural = "Quiz Questions"

    def __str__(self):
        return f"{self.scenario_name} | {'Phishing' if self.is_phishing else 'Legitimate'}"


# ── 3. USER ALERT SUBSCRIPTIONS ───────────────────────────────────────────────

class Subscriber(models.Model):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    unsubscribe_token = models.CharField(max_length=64, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.unsubscribe_token:
            import secrets
            self.unsubscribe_token = secrets.token_hex(32)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Subscriber"
        verbose_name_plural = "Subscribers"

    def __str__(self):
        return f"{self.email} ({'Active' if self.is_active else 'Unsubscribed'})"


# ── 4. SECURITY PASSCODE VERIFICATION ─────────────────────────────────────────

class PasswordResetOTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def is_expired(self):
        from django.utils import timezone
        import datetime
        return timezone.now() > self.created_at + datetime.timedelta(minutes=10)

    class Meta:
        verbose_name = "Password Reset OTP"
        verbose_name_plural = "Password Reset OTPs"

    def __str__(self):
        return f"{self.email} | {self.otp} | Verified: {self.is_verified}"

class AdminAuthKey(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_auth_key')
    auth_key = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Admin Auth Key"
        verbose_name_plural = "Admin Auth Keys"

    def __str__(self):
        return f"Auth Key for {self.user.email}"


# ── 5. USER API INTEGRATION SETTINGS ─────────────────────────────────────────

class UserIntegration(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='integration_config')
    gmail_client_id = models.CharField(max_length=255, blank=True, default='')
    gmail_access_token = models.TextField(blank=True, default='')
    twilio_sid = models.CharField(max_length=100, blank=True, default='')
    twilio_token = models.CharField(max_length=100, blank=True, default='')
    twilio_from = models.CharField(max_length=20, blank=True, default='')
    twilio_to = models.CharField(max_length=20, blank=True, default='')
    openai_api_key = models.CharField(max_length=255, blank=True, default='')
    virustotal_api_key = models.CharField(max_length=255, blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Integration Config"
        verbose_name_plural = "User Integration Configs"

    def __str__(self):
        return f"Integrations Config for {self.user.username}"


# ── 6. SAAS ROLES & SYSTEM MODULES (NEW) ──────────────────────────────────────

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('visitor', 'Visitor'),
        ('customer', 'Customer'),
        ('enterprise', 'Enterprise'),
        ('admin', 'Administrator'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    company = models.CharField(max_length=150, blank=True, default='')
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=32, blank=True, default='')
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class SupportTicket(models.Model):
    PRIORITY_CHOICES = (
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    )
    STATUS_CHOICES = (
        ('Open', 'Open'),
        ('Pending', 'Pending'),
        ('Resolved', 'Resolved'),
    )

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_tickets')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    priority = models.CharField(max_length=15, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='Open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Ticket {self.id}: {self.subject} ({self.status})"


class TicketReply(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='replies')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reply by {self.sender.username} on Ticket {self.ticket.id}"


class Notification(models.Model):
    TYPE_CHOICES = (
        ('Threat', 'Threat'),
        ('Account', 'Account'),
        ('Billing', 'Billing'),
        ('General', 'General'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='General')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notif for {self.user.username}: {self.title}"


class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    ip_address = models.GenericIPAddressField()
    device_info = models.CharField(max_length=255)
    success = models.BooleanField(default=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} login at {self.timestamp}"


class DeviceSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='device_sessions')
    device_name = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    last_active = models.DateTimeField(auto_now=True)
    is_revoked = models.BooleanField(default=False)

    def __str__(self):
        return f"Session for {self.user.username} on {self.device_name}"


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=255)
    details = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Audit: {self.action} by {self.user.username if self.user else 'System'}"

# ── 7. SUBSCRIPTIONS & PAYMENTS ───────────────────────────────────────────────

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    interval = models.CharField(max_length=20, choices=[('month', 'Monthly'), ('year', 'Yearly')])
    features = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} (${self.price}/{self.interval})"

class UserSubscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('past_due', 'Past Due'), ('canceled', 'Canceled')], default='active')
    current_period_end = models.DateTimeField()
    cancel_at_period_end = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.plan.name if self.plan else 'None'}"

class PaymentInvoice(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=[('paid', 'Paid'), ('open', 'Open'), ('failed', 'Failed')])
    date = models.DateTimeField(auto_now_add=True)
    pdf_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"Invoice {self.id} for {self.user.username} - {self.status}"

# ── 8. CONTENT MODELS (BLOGS, FAQS, TEAM) ───────────────────────────────────

class BlogPost(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    excerpt = models.TextField()
    content = models.TextField()
    category = models.CharField(max_length=100)
    author = models.CharField(max_length=255)
    author_role = models.CharField(max_length=255)
    date = models.DateField(auto_now_add=True)
    read_time = models.CharField(max_length=50)
    featured = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class FAQ(models.Model):
    category = models.CharField(max_length=100)
    question = models.CharField(max_length=500)
    answer = models.TextField()

    def __str__(self):
        return f"[{self.category}] {self.question}"

class TeamMember(models.Model):
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=255)
    bio = models.TextField()
    initials = models.CharField(max_length=10)
    color = models.CharField(max_length=20)

    def __str__(self):
        return self.name

class ScamReport(models.Model):
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    url_or_email = models.CharField(max_length=500)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('investigating', 'Investigating'), ('verified', 'Verified'), ('false_positive', 'False Positive')], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Scam Report: {self.url_or_email} ({self.status})"

class JobOpening(models.Model):
    title = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    job_type = models.CharField(max_length=50)
    experience = models.CharField(max_length=100)
    description = models.TextField()
    responsibilities = models.JSONField(default=list)
    requirements = models.JSONField(default=list)
    salary = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.department})"

class CaseStudy(models.Model):
    slug = models.SlugField(max_length=200, unique=True)
    title = models.CharField(max_length=200)
    industry = models.CharField(max_length=100)
    logo = models.CharField(max_length=50, blank=True)
    challenge = models.TextField()
    solution = models.TextField()
    results = models.JSONField(default=list)
    testimonial = models.JSONField(default=dict)
    timeline = models.CharField(max_length=100)
    technologies = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class ContactLead(models.Model):
    STATUS_CHOICES = (
        ('New', 'New'),
        ('Contacted', 'Contacted'),
        ('Closed', 'Closed'),
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    company = models.CharField(max_length=255, blank=True, default='')
    message = models.TextField()
    subscribe = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='New')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.email} ({self.status})"

# ── 9. OAUTH & THIRD-PARTY INTEGRATIONS ───────────────────────────────────────

class OAuthProvider(models.Model):
    CATEGORY_CHOICES = (
        ('Email', 'Email'),
        ('Cloud Storage', 'Cloud Storage'),
        ('Identity Providers', 'Identity Providers'),
        ('Productivity', 'Productivity'),
    )
    
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, default='')
    client_id = models.CharField(max_length=255, blank=True, default='')
    client_secret = models.CharField(max_length=255, blank=True, default='')
    redirect_uri = models.CharField(max_length=255, blank=True, default='')
    auth_url = models.CharField(max_length=255, blank=True, default='')
    token_url = models.CharField(max_length=255, blank=True, default='')
    default_scopes = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.category})"


class ConnectedAccount(models.Model):
    STATUS_CHOICES = (
        ('connected', 'Connected'),
        ('failed', 'Failed'),
        ('pending', 'Pending Authorization'),
        ('disconnected', 'Disconnected'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='connected_accounts')
    provider = models.ForeignKey(OAuthProvider, on_delete=models.CASCADE)
    provider_account_id = models.CharField(max_length=255, blank=True, default='')
    provider_account_email = models.CharField(max_length=255, blank=True, default='')
    
    access_token = models.TextField(blank=True, default='')
    refresh_token = models.TextField(blank=True, default='')
    scopes_granted = models.TextField(blank=True, default='')
    token_expires_at = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    health_status = models.CharField(max_length=20, default='Healthy') # Healthy, Warning, Critical
    
    last_sync_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'provider', 'provider_account_id')

    def __str__(self):
        return f"{self.user.username} - {self.provider.name} ({self.status})"


class IntegrationSyncLog(models.Model):
    connected_account = models.ForeignKey(ConnectedAccount, on_delete=models.CASCADE, related_name='sync_logs')
    status = models.CharField(max_length=20, choices=[('success', 'Success'), ('error', 'Error')])
    items_synced = models.IntegerField(default=0)
    threats_detected = models.IntegerField(default=0)
    message = models.TextField(blank=True, default='')
    duration_ms = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Sync for {self.connected_account} at {self.created_at}"
