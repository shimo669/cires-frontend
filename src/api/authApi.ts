import axios from 'axios';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';
import api from './axios';
import { normalizeRoleName, unwrapApiData } from './responseUtils';

const toAuthResponse = (payload: unknown): AuthResponse => {
  const data = unwrapApiData<AuthResponse>(payload);

  return {
    token: data.token,
    username: data.username,
    role: normalizeRoleName(data.role),
    email: data.email,
    nationalId: data.nationalId,
    locationId: data.locationId,
    locationName: data.locationName,
    fullRwandanAddress: data.fullRwandanAddress,
    levelType: data.levelType,
  };
};

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', credentials);
  return toAuthResponse(response.data);
};

export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/register', userData);
    return toAuthResponse(response.data);
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;

    if (status !== 404 && status !== 405) {
      throw error;
    }

    const formPayload = new URLSearchParams();
    formPayload.set('username', userData.username);
    formPayload.set('email', userData.email);
    formPayload.set('password', userData.password);
    formPayload.set('nationalId', userData.nationalId);

    if (typeof userData.locationId === 'number') {
      formPayload.set('locationId', String(userData.locationId));
    }

    const baseURL = typeof api.defaults.baseURL === 'string' ? api.defaults.baseURL : '';
    const legacyBaseURL = baseURL.endsWith('/api') ? baseURL.slice(0, -4) : '';

    const fallbackResponse = await axios.post(`${legacyBaseURL}/register/save`, formPayload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return toAuthResponse(fallbackResponse.data);
  }
};