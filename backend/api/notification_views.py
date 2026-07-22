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
        title = request.data.get('title')
        message = request.data.get('message')
        notif_type = request.data.get('type', 'General')

        if not title or not message:
            return Response({'error': 'Title and message are required'}, status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth.models import User
        users = User.objects.all()
        
        notifications = [
            Notification(user=u, title=title, message=message, notification_type=notif_type)
            for u in users
        ]
        Notification.objects.bulk_create(notifications)
        
        return Response({'status': f'Broadcast sent to {len(notifications)} users'}, status=status.HTTP_201_CREATED)
