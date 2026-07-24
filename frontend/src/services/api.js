/**
 * CyberSentinel — Centralized API Service Layer
 * 
 * All backend communication flows through this module.
 * Supports token-based authentication, error handling, and request helpers.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/* ── Token helpers ──────────────────────────────────────────────────── */
export function getToken() {
  return localStorage.getItem('cs_token');
}

function authHeaders(extra = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (token) headers.Authorization = `Token ${token}`;
  return headers;
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

  const response = await fetch(url, config);

  // Handle empty responses (204, etc.)
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error || data?.detail || `Request failed (${response.status})`);
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
  forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
  googleLogin: (credential) => api.post('/auth/google-login/', { credential }),
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
  oauthCallback: (provider_id, code) => api.post('/integrations/oauth/callback/', { provider_id, code }),
  getConnectedAccounts: () => api.get('/integrations/connected/'),
  syncAccount: (account_id) => api.post('/integrations/sync/', { account_id }),
  disconnectAccount: (account_id) => api.post('/integrations/disconnect/', { account_id }),
  getSyncLogs: (account_id) => api.get(`/integrations/connected/${account_id}/logs/`),
  getConfig: () => api.get('/integrations/config/'),
  saveConfig: (data) => api.post('/integrations/config/', data),
  importGmail: (simulated = true) => api.post('/integrations/gmail/import/', { simulated }),
};

export const supportService = {
  getTickets: () => api.get('/tickets/'),
  getTicket: (id) => api.get(`/tickets/${id}/`),
  createTicket: (data) => api.post('/tickets/', data),
  updateTicket: (id, data) => api.patch(`/tickets/${id}/`, data),
  assignTicket: (id, assignee_id) => api.post(`/tickets/${id}/assign/`, { assignee_id }),
  replyTicket: (id, content, is_internal) => api.post(`/tickets/${id}/reply/`, { content, is_internal }),
};

export const adminIntegrationService = {
  getEcosystem: () => api.get('/admin/integrations/'),
  toggleProvider: (provider_id) => api.post('/admin/integrations/', { action: 'toggle_provider', provider_id }),
  updateCredentials: (provider_id, data) => api.post('/admin/integrations/', { action: 'update_credentials', provider_id, ...data }),
  createProvider: (data) => api.post('/admin/integrations/', { action: 'create_provider', ...data }),
};

export default api;
