import axios from 'axios';

// 1. Get the base domain (Render URL or Localhost)
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081';

// 2. Ensure every request starts with /api
export const API_BASE_URL = `${BASE}/api`;

const api = axios.create({
  baseURL: API_BASE_URL, // Now this is http://localhost:8081/api OR https://backend.../api
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const requestUrl = config.url ?? '';
  // The interceptor still works because it checks if the specific endpoint contains these words
  const isPublicEndpoint = requestUrl.includes('/auth/') || requestUrl.includes('/address/');

  if (isPublicEndpoint) {
    return config;
  }

  const token = localStorage.getItem('jwt_token');

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;