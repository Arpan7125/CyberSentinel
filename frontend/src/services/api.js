/**
 * CyberSentinel — Centralized API Service Layer
 * 
 * All backend communication flows through this module.
 * Supports token-based authentication, error handling, and request helpers.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/* ── Token helpers ──────────────────────────────────────────────────── */
/**
 * The session token. It lives in localStorage, which means any script running
 * on this origin can read it — the Content-Security-Policy in vercel.json is
 * what keeps injected scripts from running in the first place. Provider tokens
 * (Google, Microsoft) are deliberately never stored here; the server holds
 * those.
 */
export function getToken() {
  return localStorage.getItem('cs_token');
}

function authHeaders(extra = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (token) headers.Authorization = `Token ${token}`;
  return headers;
}

/**
 * Turn a failed response into something a person can act on.
 *
 * Callers used to render `alert('Server might be down')` for every failure,
 * which is wrong for a rate limit, a validation error, or an expired session —
 * and tells the user to go do nothing about a problem they could fix.
 */
function messageFor(status, data) {
  if (data?.error) return data.error;
  if (data?.detail) return data.detail;

  switch (status) {
    case 400:
      return 'That request was not accepted. Check the details and try again.';
    case 401:
      return 'Your session has ended. Sign in again to continue.';
    case 403:
      return "You don't have access to that.";
    case 404:
      return "We couldn't find that.";
    case 413:
      return 'That upload is too large.';
    case 429:
      return "You've hit the rate limit. Wait a few minutes and try again.";
    case 502:
    case 503:
    case 504:
      return 'CyberSentinel is temporarily unavailable. Try again shortly.';
    default:
      return status >= 500
        ? 'Something went wrong on our side. Try again shortly.'
        : `Request failed (${status}).`;
  }
}

/* ── Core request wrapper ───────────────────────────────────────────── */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: authHeaders(options.headers),
    ...options,
  };

  // Remove Content-Type for FormData uploads
  if (config.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    const offline = new Error(
      "Can't reach CyberSentinel right now. Check your connection and try again.",
    );
    offline.status = 0;
    throw offline;
  }

  // Handle empty responses (204, etc.)
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(messageFor(response.status, data));
    error.status = response.status;
    error.data = data;
    
    // Global intercept for authentication errors
    if (response.status === 401 && !url.includes('/auth/login/')) {
      window.dispatchEvent(new CustomEvent('auth-error'));
    }
    
    throw error;
  }

  return data;
}

/* ── HTTP method shortcuts ──────────────────────────────────────────── */
export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),

  post: (endpoint, body) => request(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),

  put: (endpoint, body) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),

  patch: (endpoint, body) => request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),

  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),

  upload: (endpoint, formData) => request(endpoint, {
    method: 'POST',
    body: formData,
  }),
};

/* ── Specific service endpoints ─────────────────────────────────────── */
export const authService = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  register: (data) => api.post('/auth/register/', data),
  logout: () => api.post('/auth/logout/'),
  profile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  dataConsent: () => api.get('/auth/data-consent/'),
  setDataConsent: (decision) => api.post('/auth/data-consent/', { decision }),
  forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
  googleLogin: (credential) => api.post('/auth/google-login/', { credential }),
  microsoftLogin: (credential) => api.post('/auth/microsoft-login/', { credential }),
  adminRegister: (data) => api.post('/auth/admin-register/', data),
  adminLogin: (email, auth_key) => api.post('/auth/admin-login/', { email, auth_key }),
  deleteAccount: () => api.delete('/auth/profile/'),
};

export const scanService = {
  analyzeText: (data) => api.post('/analyze/text/', data),
  analyzeUrl: (data) => api.post('/analyze/url/', data),
  analyzeScreenshot: (formData) => api.upload('/analyze/screenshot/', formData),
  analyzeFile: (formData) => api.upload('/analyze/file/', formData),
  analyzePhone: (data) => api.post('/analyze/phone/', data),
};

export const dashboardService = {
  stats: () => api.get('/dashboard/stats/'),
};

export const quizService = {
  getQuestions: () => api.get('/quiz/'),
};

export const subscribeService = {
  subscribe: (data) => api.post('/subscribe/', data),
  unsubscribe: (token) => api.post('/unsubscribe/', { token }),
};

export const chatService = {
  send: (message, language = 'English') => api.post('/chat/', { message, language }),
};

export const adminService = {
  stats: () => api.get('/admin/stats/'),
  userAction: (data) => api.post('/admin/users/action/', data),
  subscribers: () => api.get('/admin/subscribers/'),
  getUsers: () => api.get('/users/'),
  updateUser: (id, data) => api.patch(`/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/users/${id}/`),
};

export const saasService = {
  getBlogPosts: (params = '') => api.get(`/blogs/${params}`),
  // Live, externally-sourced advisories (CISA Known Exploited Vulnerabilities).
  getThreatIntelFeed: (limit = 24) => api.get(`/intel/feed/?limit=${limit}`),
  getBlogPost: (id) => api.get(`/blogs/${id}/`),
  createBlogPost: (data) => api.post('/blogs/', data),
  updateBlogPost: (id, data) => api.patch(`/blogs/${id}/`, data),
  deleteBlogPost: (id) => api.delete(`/blogs/${id}/`),
  
  getFaqs: (params = '') => api.get(`/faqs/${params}`),
  createFaq: (data) => api.post('/faqs/', data),
  updateFaq: (id, data) => api.patch(`/faqs/${id}/`, data),
  deleteFaq: (id) => api.delete(`/faqs/${id}/`),
  
  getTeam: () => api.get('/team/'),
  getPlans: () => api.get('/plans/'),
  getSubscriptions: () => api.get('/subscriptions/'),
  getInvoices: () => api.get('/invoices/'),
  reportScam: (data) => api.post('/scam-reports/', data),
  getScamReports: () => api.get('/scam-reports/'),

  getJobs: (params = '') => api.get(`/jobs/${params}`),
  getCaseStudies: (params = '') => api.get(`/case-studies/${params}`),
};

export const integrationsService = {
  getProviders: () => api.get('/integrations/providers/'),
  startOAuth: (provider_id) => api.post('/integrations/oauth/start/', { provider_id }),
  // `state` is now required: the server issued it at the start of the flow and
  // checks it here. Without that check anyone could hand a victim an
  // authorization code and bind their own mailbox to the victim's account.
  oauthCallback: (code, state) => api.post('/integrations/oauth/callback/', { code, state }),
  getConnectedAccounts: () => api.get('/integrations/connected/'),
  syncAccount: (account_id) => api.post('/integrations/sync/', { account_id }),
  disconnectAccount: (account_id) => api.post('/integrations/disconnect/', { account_id }),
  getSyncLogs: (account_id) => api.get(`/integrations/connected/${account_id}/logs/`),
  getConfig: () => api.get('/integrations/config/'),
  saveConfig: (data) => api.post('/integrations/config/', data),
  // No token is passed. The server reads the connection it stored during the
  // OAuth callback; a Google access token has no business being in
  // localStorage, where any injected script can read it.
  importGmail: () => api.post('/integrations/gmail/import/'),
};

export const securityService = {
  getLoginHistory: () => api.get('/security/login-history/'),
  getSessions: () => api.get('/security/sessions/'),
  revokeSession: (id) => api.post(`/security/sessions/${id}/revoke/`),
  getApiKeys: () => api.get('/security/api-keys/'),
  createApiKey: (name) => api.post('/security/api-keys/', { name }),
  revokeApiKey: (id) => api.delete(`/security/api-keys/${id}/`),
};

export const supportService = {
  getTickets: () => api.get('/tickets/'),
  getTicket: (id) => api.get(`/tickets/${id}/`),
  createTicket: (data) => api.post('/tickets/', data),
  updateTicket: (id, data) => api.patch(`/tickets/${id}/`, data),
  assignTicket: (id, assignee_id) => api.post(`/tickets/${id}/assign/`, { assignee_id }),
  replyTicket: (id, content, is_internal) => api.post(`/tickets/${id}/reply/`, { content, is_internal }),
};

/**
 * Live analytics. Every figure these return is computed from real rows in the
 * database — these endpoints exist to replace the hard-coded arrays the
 * dashboards used to render. When there is no data yet they report zero and
 * set an explicit empty-state flag rather than inventing plausible numbers.
 */
export const analyticsService = {
  adminAnalytics: (days = 30) => api.get(`/admin/analytics/?days=${days}`),
  adminRevenue: (months = 7) => api.get(`/admin/revenue/?months=${months}`),
  adminThreatCenter: (days = 30) => api.get(`/admin/threat-center/?days=${days}`),
};

/** Per-user insights, usage, and forecasts. */
export const insightsService = {
  insights: (days = 30) => api.get(`/insights/?days=${days}`),
  usage: () => api.get('/usage/'),
  forecast: (days = 30) => api.get(`/forecast/?days=${days}`),
};

/**
 * Which optional integrations the server actually has configured. Lets the UI
 * hide a Google button rather than rendering one that fails when clicked.
 */
export const configService = {
  publicConfig: () => api.get('/config/public/'),
};

export const notificationService = {
  list: () => api.get('/notifications/'),
  markRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
  /** Admin only. Creates one in-app notification per registered user. */
  broadcast: (data) => api.post('/notifications/broadcast/', data),
};

export const healthService = {
  status: () => api.get('/health/'),
  readiness: () => api.get('/health/ready/'),
};

export const adminIntegrationService = {
  getEcosystem: () => api.get('/admin/integrations/'),
  toggleProvider: (provider_id) => api.post('/admin/integrations/', { action: 'toggle_provider', provider_id }),
  updateCredentials: (provider_id, data) => api.post('/admin/integrations/', { action: 'update_credentials', provider_id, ...data }),
  createProvider: (data) => api.post('/admin/integrations/', { action: 'create_provider', ...data }),
};

export default api;
