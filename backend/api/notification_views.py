from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Notification
from .serializers import NotificationSerializer
from .permissions import IsCustomer, IsAdmin

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsCustomer])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['post'], permission_classes=[IsCustomer])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'All notifications marked as read'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def broadcast(self, request):
        title = (request.data.get('title') or '').strip()
        message = (request.data.get('message') or '').strip()
        notif_type = (request.data.get('type') or 'General').strip()

        if not title or not message:
            return Response({'error': 'Title and message are required'}, status=status.HTTP_400_BAD_REQUEST)

        # `choices` is not enforced on save, only on full_clean, so an unchecked
        # value here would be written straight to the column and then render as
        # an unrecognised category everywhere it is displayed.
        valid_types = {value for value, _ in Notification.TYPE_CHOICES}
        if notif_type not in valid_types:
            return Response(
                {'error': f"Invalid type. Choose one of: {', '.join(sorted(valid_types))}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.contrib.auth.models import User

        notifications = [
            Notification(user=u, title=title, message=message, notification_type=notif_type)
            for u in User.objects.only('id').iterator()
        ]

        if not notifications:
            return Response({'status': 'No registered accounts to notify.'}, status=status.HTTP_200_OK)

        Notification.objects.bulk_create(notifications, batch_size=500)

        count = len(notifications)
        return Response(
            {'status': f'Broadcast delivered to {count} account{"s" if count != 1 else ""}.'},
            status=status.HTTP_201_CREATED,
        )
