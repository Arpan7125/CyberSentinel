from rest_framework import viewsets, permissions, filters
from django.contrib.auth.models import User
from .models import (
    SubscriptionPlan, UserSubscription, PaymentInvoice,
    BlogPost, FAQ, TeamMember, ScamReport, JobOpening, CaseStudy, ContactLead
)
from .serializers import (
    SubscriptionPlanSerializer, UserSubscriptionSerializer, PaymentInvoiceSerializer,
    BlogPostSerializer, FAQSerializer, TeamMemberSerializer, ScamReportSerializer,
    UserSerializer, JobOpeningSerializer, CaseStudySerializer, ContactLeadSerializer
)

class ReadOnlyOrAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [ReadOnlyOrAdminPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['price']

class UserSubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return UserSubscription.objects.all()
        return UserSubscription.objects.filter(user=self.request.user)

class PaymentInvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date']
    ordering = ['-date']
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return PaymentInvoice.objects.all()
        return PaymentInvoice.objects.filter(user=self.request.user)

class BlogPostViewSet(viewsets.ModelViewSet):
    serializer_class = BlogPostSerializer
    permission_classes = [ReadOnlyOrAdminPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'author']
    ordering_fields = ['date']
    ordering = ['-date']

    def get_queryset(self):
        queryset = BlogPost.objects.all()
        category = self.request.query_params.get('category', None)
        featured = self.request.query_params.get('featured', None)
        slug = self.request.query_params.get('slug', None)
        if category and category != 'All':
            queryset = queryset.filter(category=category)
        if featured is not None:
            queryset = queryset.filter(featured=featured.lower() == 'true')
        if slug:
            queryset = queryset.filter(slug=slug)
        return queryset

class FAQViewSet(viewsets.ModelViewSet):
    serializer_class = FAQSerializer
    permission_classes = [ReadOnlyOrAdminPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['question', 'answer']
    
    def get_queryset(self):
        queryset = FAQ.objects.all()
        category = self.request.query_params.get('category', None)
        if category and category != 'All':
            queryset = queryset.filter(category=category)
        return queryset

class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [ReadOnlyOrAdminPermission]

class ScamReportViewSet(viewsets.ModelViewSet):
    queryset = ScamReport.objects.all()
    serializer_class = ScamReportSerializer
    permission_classes = [permissions.AllowAny]
    
    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user if self.request.user.is_authenticated else None)

class JobOpeningViewSet(viewsets.ModelViewSet):
    queryset = JobOpening.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = JobOpeningSerializer
    permission_classes = [ReadOnlyOrAdminPermission]

class CaseStudyViewSet(viewsets.ModelViewSet):
    queryset = CaseStudy.objects.all().order_by('-created_at')
    serializer_class = CaseStudySerializer
    permission_classes = [ReadOnlyOrAdminPermission]
    lookup_field = 'slug'

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'username']
    ordering = ['-date_joined']

    def perform_update(self, serializer):
        user = serializer.save()
        role = self.request.data.get('role')
        if role and hasattr(user, 'profile'):
            user.profile.role = role
            user.profile.save()

class ContactLeadViewSet(viewsets.ModelViewSet):
    queryset = ContactLead.objects.all().order_by('-created_at')
    serializer_class = ContactLeadSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
