import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';
import api from './axios';

const normalizeRole = (role: string): AuthResponse['role'] => {
  const normalized = role.replace(/^ROLE_/, '').toUpperCase();

  if (normalized === 'ADMIN' || normalized === 'LEADER' || normalized === 'CITIZEN') {
    return normalized;
  }

  return 'CITIZEN';
};

const toAuthResponse = (payload: unknown): AuthResponse => {
  const data = (payload as { data?: AuthResponse })?.data ?? (payload as AuthResponse);

  return {
    token: data.token,
    username: data.username,
    role: normalizeRole(data.role),
  };
};

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', credentials);
  return toAuthResponse(response.data);
};

export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', userData);
  return toAuthResponse(response.data);
};