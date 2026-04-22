import axios from 'axios';

const normalizeApiBaseUrl = (rawUrl?: string) => {
  const fallback = 'http://localhost:5000/api';
  if (!rawUrl) return fallback;

  const trimmed = rawUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
};

const api = axios.create({
  baseURL: normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.url?.startsWith('/auth')) {
    console.log('[auth][frontend] Request', { method: config.method, url: config.url });
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.config?.url?.startsWith('/auth')) {
      console.error('[auth][frontend] Request failed', {
        method: error.config.method,
        url: error.config.url,
        status: error.response?.status,
        error: error.response?.data?.error || error.message,
      });
    }
    return Promise.reject(error);
  }
);

export default api;
