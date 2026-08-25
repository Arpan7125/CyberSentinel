from rest_framework import viewsets, permissions, filters
from django.contrib.auth.models import User

from .throttles import PublicWriteThrottle
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
    """Public to read, staff to write. Used for marketing content."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class CreateOnlyOrOwner(permissions.BasePermission):
    """Anyone may submit; only the owner or staff may read or change.

    Applies to user-submitted reports. `AllowAny` on a ModelViewSet covers every
    verb, not just create — which is how the scam-report endpoint ended up
    letting anonymous callers list, edit, and delete everybody's reports.
    """

    def has_permission(self, request, view):
        if view.action == 'create':
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.reported_by_id == request.user.id

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [ReadOnlyOrAdminPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['price']

class UserSubscriptionViewSet(viewsets.ModelViewSet):
    """A user's own subscriptions.

    `get_queryset` scoped reads correctly, but with no `perform_create` and an
    `__all__` serializer a client could POST a subscription for any user on any
    plan. Ownership is now forced from the request, and changing which plan you
    are on is a staff action — self-service upgrades have to go through billing,
    not through a generic model write.
    """

    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return UserSubscription.objects.all()
        return UserSubscription.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if not self.request.user.is_staff and 'plan' in self.request.data:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Plan changes go through billing, not this endpoint.')
        serializer.save(user=serializer.instance.user)

class PaymentInvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """Invoices are read-only to everyone.

    They are produced by the billing system. As a writable ModelViewSet a user
    could forge their own payment history.
    """

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
    """Community scam reports.

    Anyone may submit one — that is the point of the feature — but reports
    contain the reporter's own description of what happened to them, often with
    phone numbers and message text. Reading is therefore scoped to the reporter
    and to staff, and anonymous writes are throttled.
    """

    serializer_class = ScamReportSerializer
    permission_classes = [CreateOnlyOrOwner]

    def get_throttles(self):
        if self.action == 'create' and not self.request.user.is_authenticated:
            return [PublicWriteThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ScamReport.objects.none()
        if user.is_staff:
            return ScamReport.objects.all().order_by('-created_at')
        return ScamReport.objects.filter(reported_by=user).order_by('-created_at')

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

    def get_throttles(self):
        # An open, unauthenticated write endpoint with no rate limit is a
        # spam intake.
        if self.action == 'create' and not self.request.user.is_authenticated:
            return [PublicWriteThrottle()]
        return super().get_throttles()
