from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import SupportTicket, TicketReply
from .serializers import SupportTicketSerializer, TicketReplySerializer
from .permissions import IsCustomer, IsAdmin

class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        user = self.request.user
        # Admins get all tickets, regular customers get only their own
        try:
            if user.profile.role == 'admin' or user.is_superuser:
                return SupportTicket.objects.all()
        except AttributeError:
            pass
        return SupportTicket.objects.filter(customer=user)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsCustomer])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        content = request.data.get('content')
        is_internal = request.data.get('is_internal', False)

        if not content:
            return Response({'error': 'Reply content is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce internal note permissions
        if is_internal:
            try:
                if request.user.profile.role != 'admin' and not request.user.is_superuser:
                    return Response({'error': 'Permission denied for internal notes'}, status=status.HTTP_403_FORBIDDEN)
            except AttributeError:
                if not request.user.is_superuser:
                    return Response({'error': 'Permission denied for internal notes'}, status=status.HTTP_403_FORBIDDEN)

        reply = TicketReply.objects.create(
            ticket=ticket,
            sender=request.user,
            content=content,
            is_internal=is_internal
        )
        return Response(TicketReplySerializer(reply).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign(self, request, pk=None):
        ticket = self.get_object()
        assignee_id = request.data.get('assignee_id')
        if not assignee_id:
            return Response({'error': 'Assignee ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.contrib.auth.models import User
        try:
            assignee = User.objects.get(id=assignee_id)
            ticket.assignee = assignee
            ticket.save()
            return Response(SupportTicketSerializer(ticket).data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
