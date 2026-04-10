import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const requestUrl = config.url ?? '';
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