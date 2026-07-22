export const KNOWLEDGE_BASE = {
  defaultResponse: {
    English: "Hello, I am the CyberSentinel AI Assistant. How can I help you today?",
    Hindi: "नमस्ते, मैं CyberSentinel AI Assistant हूँ। मैं आज आपकी कैसे मदद कर सकता हूँ?"
  },
  intents: [
    {
      keywords: ["price", "cost", "pricing", "plan"],
      responses: {
        English: "You can find our pricing details on our pricing page.",
        Hindi: "आप हमारे प्राइसिंग पेज पर विवरण देख सकते हैं।"
      },
      actions: [
         { label: '💳 View Pricing', type: 'navigate', path: '/pricing' }
      ]
    },
    {
      keywords: ["connect", "gmail", "outlook", "integration", "integrations", "oauth", "linked", "accounts"],
      responses: {
        English: "You can securely connect services like Gmail, Outlook, and Microsoft 365 in the Connected Accounts Center. No passwords required — we use OAuth 2.0!",
        Hindi: "आप कनेक्टेड अकाउंट्स सेंटर में Gmail, Outlook और Microsoft 365 जैसी सेवाओं को सुरक्षित रूप से जोड़ सकते हैं।"
      },
      actions: [
         { label: '🔗 Connected Accounts', type: 'navigate', path: '/dashboard/integrations' }
      ]
    }
  ]
};
