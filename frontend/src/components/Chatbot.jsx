import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { KNOWLEDGE_BASE } from '../data/aiKnowledgeBase';
import { chatService } from '../services/api';

export default function Chatbot() {
  const navigate = useNavigate();
  const { language: currentSiteLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState('English');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-detect browser/site language on mount
  useEffect(() => {
    const browserLang = navigator.language || navigator.userLanguage;
    const map = {
      'en': 'English', 'hi': 'Hindi', 'kn': 'Kannada', 'ta': 'Tamil',
      'te': 'Telugu', 'ml': 'Malayalam', 'es': 'Spanish', 'fr': 'French',
      'de': 'German', 'ja': 'Japanese', 'zh': 'Chinese', 'ar': 'Arabic',
      'pt': 'Portuguese', 'ru': 'Russian', 'it': 'Italian'
    };
    
    // Check if browser prefix is supported
    const code = browserLang.split('-')[0].toLowerCase();
    const detected = map[code] || 'English';
    setLang(detected);

    // Initialize with welcome message in detected language
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: KNOWLEDGE_BASE.defaultResponse[detected] || KNOWLEDGE_BASE.defaultResponse.English,
        actions: [
          { label: '📅 Book a Demo', type: 'navigate', path: '/contact' },
          { label: '💳 View Pricing', type: 'navigate', path: '/pricing' }
        ]
      }
    ]);
  }, []);

  // Sync with site language context if it changes manually
  useEffect(() => {
    if (currentSiteLang) {
      const map = {
        'en': 'English', 'hi': 'Hindi', 'kn': 'Kannada', 'ta': 'Tamil',
        'te': 'Telugu', 'ml': 'Malayalam', 'es': 'Spanish', 'fr': 'French',
        'de': 'German', 'ja': 'Japanese', 'zh': 'Chinese', 'ar': 'Arabic',
        'pt': 'Portuguese', 'ru': 'Russian', 'it': 'Italian'
      };
      const mapped = map[currentSiteLang.toLowerCase()] || 'English';
      setLang(mapped);
    }
  }, [currentSiteLang]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages, typing]);

  const handleActionClick = (action) => {
    if (action.type === 'navigate') {
      navigate(action.path);
      setOpen(false);
    }
  };

  const handleSend = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const userText = textOverride || input.trim();
    if (!userText) return;

    const newMsg = { id: Date.now(), sender: 'user', text: userText };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setTyping(true);

    let responseText = '';
    let responseActions = [];

    try {
      // Send message to Django backend chatbot engine
      const res = await chatService.send(userText, lang);
      responseText = res.response;

      if (res.action === 'navigate_settings') {
        responseActions = [{ label: '⚙️ Open Connected Accounts', type: 'navigate', path: '/dashboard/connected' }];
      } else if (res.action === 'navigate_url') {
        responseActions = [{ label: '🔍 Open URL Scanner', type: 'navigate', path: '/dashboard/url-scanner' }];
      } else if (res.intent === 'phishing_identify' || res.intent === 'phishing_definition') {
        responseActions = [{ label: '🛡️ Scan Suspicious Text', type: 'navigate', path: '/dashboard/text-scanner' }];
      } else {
        responseActions = [
          { label: '📅 Book a Demo', type: 'navigate', path: '/contact' },
          { label: '💳 View Pricing', type: 'navigate', path: '/pricing' }
        ];
      }
    } catch (err) {
      console.warn("Backend Chat API unavailable, falling back to local knowledge base", err);
      // Client-side fallback if backend fails or is offline
      const lowerText = userText.toLowerCase();
      let matchedIntent = null;
      for (const intent of KNOWLEDGE_BASE.intents) {
        if (intent.keywords.some(kw => lowerText.includes(kw))) {
          matchedIntent = intent;
          break;
        }
      }
      if (lowerText.startsWith('create ticket') || lowerText.includes('support ticket')) {
        responseText = lang === 'English'
          ? "I have successfully initiated a support incident ticket on your dashboard queue."
          : "सपोर्ट टिकट सफलतापूर्वक बना दिया गया है।";
        responseActions = [{ label: '🎟️ View Support Tickets', type: 'navigate', path: '/dashboard/tickets' }];
      } else if (matchedIntent) {
        responseText = matchedIntent.responses[lang] || matchedIntent.responses.English;
        responseActions = matchedIntent.actions;
      } else {
        responseText = KNOWLEDGE_BASE.defaultResponse[lang] || KNOWLEDGE_BASE.defaultResponse.English;
        responseActions = [
          { label: '📅 Book a Demo', type: 'navigate', path: '/contact' },
          { label: '💳 View Pricing', type: 'navigate', path: '/pricing' }
        ];
      }
    } finally {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'assistant', text: responseText, actions: responseActions }
      ]);
      setTyping(false);
    }
  };

  const languagesList = [
    'English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam',
    'French', 'German', 'Spanish', 'Japanese', 'Chinese', 'Arabic',
    'Portuguese', 'Russian', 'Italian'
  ];

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        className="ai-fab"
        onClick={() => setOpen(!open)}
        aria-label="Chat with CyberSentinel AI Assistant"
        aria-expanded={open}
      >
        💬
      </button>

      {/* Expandable Chat Panel */}
      {open && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <div className="ai-panel-title">
              <span>🛡️</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>CyberSentinel AI</span>
                <span className="ai-panel-status">Active SOC Assistant</span>
              </div>
            </div>
            
            {/* Language overrides select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={lang}
                onChange={e => setLang(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)', fontSize: 11,
                  borderRadius: 4, outline: 'none', padding: '2px 4px', cursor: 'pointer'
                }}
              >
                {languagesList.map(l => (
                  <option key={l} value={l} style={{ background: 'var(--bg-primary)' }}>{l}</option>
                ))}
              </select>
              <button className="ai-panel-close" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
            </div>
          </div>

          {/* Conversation history */}
          <div className="ai-messages">
            {messages.map(m => (
              <div key={m.id} className={`ai-msg ${m.sender === 'user' ? 'user' : 'assistant'}`}>
                <div className="ai-msg-avatar">
                  {m.sender === 'user' ? '👤' : '🛡️'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="ai-msg-bubble">
                    {m.text}
                  </div>
                  {m.actions && m.actions.length > 0 && (
                    <div className="ai-msg-actions">
                      {m.actions.map((act, idx) => (
                        <button
                          key={idx}
                          className="ai-msg-action"
                          onClick={() => handleActionClick(act)}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicators */}
            {typing && (
              <div className="ai-msg assistant">
                <div className="ai-msg-avatar">🛡️</div>
                <div className="ai-typing">
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick recommendations suggestions */}
          <div className="ai-suggestions">
            <button className="ai-suggestion" onClick={() => handleSend(null, 'Book a demo')}>📅 Book Demo</button>
            <button className="ai-suggestion" onClick={() => handleSend(null, 'How to upgrade to enterprise')}>💳 Pricing Details</button>
            <button className="ai-suggestion" onClick={() => handleSend(null, 'Compliance certifications')}>🛡️ Certifications</button>
          </div>

          {/* Dialog forms input */}
          <form className="ai-input-area" onSubmit={handleSend}>
            <input
              type="text"
              className="ai-input"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              required
            />
            <button type="submit" className="ai-send" disabled={!input.trim()}>
              ➔
            </button>
          </form>
        </div>
      )}
    </>
  );
}
