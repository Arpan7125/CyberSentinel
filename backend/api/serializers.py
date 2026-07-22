from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    ScanLog, QuizQuestion, UserProfile, SupportTicket, 
    TicketReply, Notification, LoginHistory, DeviceSession, AuditLog,
    SubscriptionPlan, UserSubscription, PaymentInvoice, BlogPost, FAQ, TeamMember, ScamReport,
    JobOpening, CaseStudy, ContactLead
)

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    company = serializers.CharField(source='profile.company', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'company']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

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

class SupportTicketSerializer(serializers.ModelSerializer):
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    assignee_name = serializers.CharField(source='assignee.username', read_only=True)
    replies = TicketReplySerializer(many=True, read_only=True)
    
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

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    
    class Meta:
        model = UserSubscription
        fields = '__all__'

class PaymentInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInvoice
        fields = '__all__'

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
    reporter_email = serializers.CharField(source='reported_by.email', read_only=True)
    
    class Meta:
        model = ScamReport
        fields = '__all__'

class JobOpeningSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobOpening
        fields = '__all__'

class CaseStudySerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseStudy
        fields = '__all__'

class ContactLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactLead
        fields = '__all__'
