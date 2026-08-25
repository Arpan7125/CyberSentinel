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
        # Admins get all tickets, regular customers get only their own.
        # `is_staff` is included so this agrees with the IsAdmin permission
        # class — an admin without a profile row used to be scoped to their own
        # tickets while still passing the admin-only actions below.
        if user.is_staff or user.is_superuser or getattr(getattr(user, 'profile', None), 'role', '') == 'admin':
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(customer=user)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsCustomer])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        content = (request.data.get('content') or '').strip()
        wants_internal = bool(request.data.get('is_internal', False))

        if not content:
            return Response({'error': 'Reply content is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(content) > 10000:
            return Response({'error': 'Reply is too long. Keep it under 10,000 characters.'},
                            status=status.HTTP_400_BAD_REQUEST)

        is_staff = (request.user.is_staff or request.user.is_superuser
                    or getattr(getattr(request.user, 'profile', None), 'role', '') == 'admin')

        if wants_internal and not is_staff:
            return Response({'error': 'Only staff can add internal notes.'},
                            status=status.HTTP_403_FORBIDDEN)

        reply = TicketReply.objects.create(
            ticket=ticket,
            sender=request.user,
            content=content,
            is_internal=wants_internal and is_staff,
        )
        return Response(TicketReplySerializer(reply, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)

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
            return Response(SupportTicketSerializer(ticket, context={'request': request}).data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
