from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .chatbot_engine import get_bot_response


class ChatbotView(APIView):
    """AI Chatbot endpoint for cybersecurity assistance.

    Public so the site-wide help widget works before sign-in; the project-wide
    anon throttle caps how hard it can be hit.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get('message', '').strip()
        language = request.data.get('language', 'English')
        
        if not message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(message) > 1000:
            return Response({'error': 'Message too long (max 1000 characters).'}, status=status.HTTP_400_BAD_REQUEST)
        
        result = get_bot_response(message, language)
        
        return Response({
            'response': result['response'],
            'intent': result['intent'],
            'action': result.get('action')
        }, status=status.HTTP_200_OK)
