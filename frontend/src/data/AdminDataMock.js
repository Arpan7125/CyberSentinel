export const MOCK_ADMIN_DATA = {
  labels: [
    { id: 'lbl-1', name: 'Enterprise', color: '#AF52DE', bg: 'rgba(175,82,222,0.1)' },
    { id: 'lbl-2', name: 'Urgent', color: '#FF453A', bg: 'rgba(255,69,58,0.1)' },
  ],
  dashboardWidgets: {
    newUsersToday: 142,
    expiringSubscriptions: 28,
    failedPayments: 7,
    highPriorityReports: 12,
    supportQueue: 45,
    pendingReviews: 3,
    systemAlerts: 1,
    aiEscalations: 5
  },
  users: [
    { 
      id: 'usr-1', 
      name: 'Joshua Joby', 
      email: 'joshua@cybersentinel.ai', 
      company: 'CyberSentinel', 
      plan: 'Enterprise', 
      country: 'India', 
      role: 'Admin', 
      status: 'Active', 
      riskScore: 5, 
      securityScore: 98,
      created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
      lastLogin: new Date(Date.now() - 1000 * 60 * 5).toISOString(), 
      paymentStatus: 'Paid',
      renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 17).toISOString(),
      devices: 3, 
      tags: ['Internal', 'Root'],
      timeline: [
        { id: 't1', date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), event: 'Logged in from Mumbai, India (IP: 14.139.1.1)' },
        { id: 't2', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), event: 'Upgraded subscription to Enterprise' }
      ],
      billingHistory: [
        { id: 'inv-101', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), amount: '$0.00', status: 'Paid', method: 'Stripe', invoiceUrl: '#' }
      ],
      supportTickets: [],
      notes: 'Internal Super Admin account. Do not modify permissions.'
    },
    { 
      id: 'usr-2', 
      name: 'Sarah Connor', 
      email: 'sconnor@techdyne.ai', 
      company: 'TechDyne', 
      plan: 'Premium', 
      country: 'USA', 
      role: 'Customer', 
      status: 'Active', 
      riskScore: 24, 
      securityScore: 82,
      created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), 
      paymentStatus: 'Failed',
      renewalDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      devices: 2, 
      tags: ['Premium', 'At Risk'],
      timeline: [
        { id: 't1', date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), event: 'Logged in from California, USA (IP: 192.168.1.1)' },
        { id: 't2', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), event: 'Payment failed for invoice INV-102 (Insufficient Funds)' }
      ],
      billingHistory: [
        { id: 'inv-102', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), amount: '$299.00', status: 'Failed', method: 'Visa ending 4242', invoiceUrl: '#' },
        { id: 'inv-98', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 32).toISOString(), amount: '$299.00', status: 'Paid', method: 'Visa ending 4242', invoiceUrl: '#' }
      ],
      supportTickets: [
        { id: 'sup-1', subject: 'API Gateway blocked', status: 'Open', priority: 'High', date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() }
      ],
      notes: 'Client complained about false positives on their Jenkins pipeline. See support ticket sup-1.'
    },
    { 
      id: 'usr-3', 
      name: 'Michael Chen', 
      email: 'mchen@startup.io', 
      company: 'Startup IO', 
      plan: 'Free', 
      country: 'Canada', 
      role: 'Customer', 
      status: 'Inactive', 
      riskScore: 8, 
      securityScore: 65,
      created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), 
      paymentStatus: 'N/A',
      renewalDate: 'N/A',
      devices: 1, 
      tags: [],
      timeline: [
        { id: 't1', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), event: 'Logged in from Toronto, Canada' }
      ],
      billingHistory: [],
      supportTickets: [],
      notes: 'Has not logged in for 45 days. Candidate for re-engagement email.'
    }
  ],
  support: [
    {
      id: 'msg-1',
      type: 'demo_request',
      status: 'unread',
      sender: 'John Smith',
      company: 'Acme Corp',
      email: 'john@acme.com',
      subject: 'Request Demo: Enterprise SIEM',
      preview: 'We are looking to replace our current Splunk setup with CyberSentinel for 5,000 endpoints...',
      date: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      tags: ['Enterprise', 'Sales'],
      details: { industry: 'Finance', employees: '5000+', budget: '$100k+', fullMessage: 'We are looking to replace our current Splunk setup with CyberSentinel for 5,000 endpoints. We need advanced threat hunting and compliance reporting (SOC2/PCI-DSS). Can we schedule a demo for next Tuesday?' },
      thread: [
        { sender: 'John Smith', date: new Date(Date.now() - 1000 * 60 * 15).toISOString(), message: 'We are looking to replace our current Splunk setup with CyberSentinel for 5,000 endpoints. We need advanced threat hunting and compliance reporting (SOC2/PCI-DSS). Can we schedule a demo for next Tuesday?' }
      ]
    },
    {
      id: 'msg-2',
      type: 'support_ticket',
      status: 'read',
      sender: 'Sarah Connor',
      company: 'TechDyne',
      email: 'sconnor@techdyne.ai',
      subject: 'False Positive: API Gateway blocked',
      preview: 'Our production Jenkins pipeline is getting blocked by the WAF ruleset...',
      date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      tags: ['Urgent', 'Support'],
      details: { priority: 'High', assignedTo: 'SOC Team Alpha', fullMessage: 'Our production Jenkins pipeline is getting blocked by the WAF ruleset. It seems the new heuristics engine is flagging our deployment scripts as obfuscated malware. Need this whitelisted ASAP.' },
      thread: [
        { sender: 'Sarah Connor', date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), message: 'Our production Jenkins pipeline is getting blocked by the WAF ruleset. It seems the new heuristics engine is flagging our deployment scripts as obfuscated malware. Need this whitelisted ASAP.' },
        { sender: 'System AI', isInternal: true, date: new Date(Date.now() - 1000 * 60 * 55 * 1).toISOString(), message: 'Automated Log Analysis: Detected 45 blocked requests from IP 192.168.1.55 matching rule WAF-OBF-001.' }
      ]
    }
  ],
  payments: [
    { id: 'inv-102', user: 'Sarah Connor', email: 'sconnor@techdyne.ai', amount: 299.00, status: 'Failed', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), gateway: 'Stripe', receiptUrl: '#' },
    { id: 'inv-103', user: 'Alice Wonderland', email: 'alice@umbrella.corp', amount: 299.00, status: 'Paid', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), gateway: 'Stripe', receiptUrl: '#' },
    { id: 'inv-104', user: 'Corp Admin', email: 'billing@megacorp.com', amount: 4999.00, status: 'Paid', date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), gateway: 'Wire Transfer', receiptUrl: '#' }
  ],
  auditLogs: [
    { id: 'log-1', time: new Date(Date.now() - 1000 * 60 * 2).toISOString(), admin: 'Joshua Joby', action: 'Update Firewall Rule', target: 'Global WAF', ip: '10.0.0.5', status: 'Success' },
    { id: 'log-2', time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), admin: 'System AI', action: 'Auto-ban IP', target: '198.51.100.72', ip: 'Localhost', status: 'Success' },
    { id: 'log-3', time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), admin: 'Joshua Joby', action: 'Viewed User Profile', target: 'usr-2 (Sarah Connor)', ip: '10.0.0.5', status: 'Success' }
  ],
  aiChats: [
    {
      id: 'chat-1', type: 'ai_chat', user: 'Joshua Joby', email: 'joshua@cybersentinel.ai', topic: 'Ransomware analysis',
      preview: 'I have a suspicious file, could you analyze it?', confidence: 95, status: 'read',
      date: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      details: { interactionCount: 5, resolution: 'Escalated to File Scanner', fullMessage: "User: I have a suspicious file, could you analyze it?\nAI: Yes, please upload it via the File Scanner tool.\nUser: Uploaded.\nAI: Analysis complete. Found 2 critical threats." },
      thread: [
        { sender: 'User', date: new Date(Date.now() - 1000 * 60 * 5).toISOString(), message: 'I have a suspicious file, could you analyze it?' },
        { sender: 'System AI', date: new Date(Date.now() - 1000 * 60 * 4).toISOString(), message: 'Yes, please upload it via the File Scanner tool.' }
      ]
    }
  ]
};
