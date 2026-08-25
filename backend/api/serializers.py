from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    ScanLog, QuizQuestion, UserProfile, SupportTicket,
    TicketReply, Notification, LoginHistory, DeviceSession, AuditLog,
    SubscriptionPlan, UserSubscription, PaymentInvoice, BlogPost, FAQ, TeamMember, ScamReport,
    JobOpening, CaseStudy, ContactLead, DeveloperApiKey
)

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    company = serializers.CharField(source='profile.company', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'company']

class UserProfileSerializer(serializers.ModelSerializer):
    """`role` drives the IsAdmin / IsEnterprise permission classes, so it can
    never be writable through a profile update."""

    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['user', 'role', 'mfa_secret']

class ScanLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanLog
        fields = '__all__'

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = '__all__'

class TicketReplySerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = TicketReply
        fields = ['id', 'ticket', 'sender', 'sender_name', 'content', 'is_internal', 'created_at']
        read_only_fields = ['sender', 'is_internal', 'created_at']

class SupportTicketSerializer(serializers.ModelSerializer):
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    assignee_name = serializers.CharField(source='assignee.username', read_only=True)
    replies = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)

    def get_replies(self, ticket):
        """Hide staff-only notes from the customer.

        `replies` used to be a plain nested serializer, so every internal note
        an agent wrote was delivered to the customer who opened the ticket.
        """
        request = self.context.get('request')
        is_staff = bool(request and request.user and request.user.is_staff)
        queryset = ticket.replies.all()
        if not is_staff:
            queryset = queryset.filter(is_internal=False)
        return TicketReplySerializer(queryset, many=True, context=self.context).data

    
    class Meta:
        model = SupportTicket
        fields = ['id', 'customer', 'customer_email', 'assignee', 'assignee_name', 'subject', 'category', 'priority', 'status', 'created_at', 'updated_at', 'replies']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = '__all__'

class DeviceSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceSession
        fields = '__all__'

class DeveloperApiKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = DeveloperApiKey
        fields = ['id', 'name', 'prefix', 'created_at']  # key_hash is never exposed


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class UserSubscriptionSerializer(serializers.ModelSerializer):
    """`user` is set from the request, never from the payload.

    Previously this was `__all__` on a ModelViewSet with no `perform_create`,
    so any signed-in user could POST a subscription naming any user id and any
    plan — a free upgrade to Enterprise, and the ability to attach a plan to
    someone else's account.
    """

    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)

    class Meta:
        model = UserSubscription
        fields = '__all__'
        read_only_fields = ['user']

class PaymentInvoiceSerializer(serializers.ModelSerializer):
    """Invoices are issued by the billing system, never by the client."""

    class Meta:
        model = PaymentInvoice
        fields = '__all__'
        read_only_fields = ['user']

class BlogPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = '__all__'

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = '__all__'

class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = '__all__'

class ScamReportSerializer(serializers.ModelSerializer):
    """Explicit field list, not `__all__`.

    With `__all__` a client could set `reported_by` (attributing a report to
    someone else) and `status` (marking their own report resolved). Those are
    server-owned and now read-only.
    """

    reporter_email = serializers.CharField(source='reported_by.email', read_only=True)

    class Meta:
        model = ScamReport
        fields = '__all__'
        read_only_fields = ['reported_by', 'status', 'created_at']

class JobOpeningSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobOpening
        fields = '__all__'

class CaseStudySerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseStudy
        fields = '__all__'

class ContactLeadSerializer(serializers.ModelSerializer):
    """Anonymous callers may create a lead but not triage one."""

    class Meta:
        model = ContactLead
        fields = '__all__'
        read_only_fields = ['status', 'created_at']
