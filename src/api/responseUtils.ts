import type { UserRole } from '../types/auth';
import type { AxiosError } from 'axios';

interface ApiResponseEnvelope<T> {
  code?: number;
  data?: T;
  message?: string;
  success?: boolean;
}

export const unwrapApiData = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object') {
    const envelope = payload as ApiResponseEnvelope<T>;

    if ('data' in envelope) {
      return envelope.data as T;
    }

    if ('code' in envelope && 'message' in envelope) {
      return (envelope.data as T) ?? (payload as T);
    }
  }

  return payload as T;
};

export const extractApiMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const typedPayload = payload as { message?: unknown; data?: { message?: unknown } };

  if (typeof typedPayload.message === 'string' && typedPayload.message.trim()) {
    return typedPayload.message;
  }

  if (typeof typedPayload.data?.message === 'string' && typedPayload.data.message.trim()) {
    return typedPayload.data.message;
  }

  return fallback;
};

export const extractAxiosErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<{ message?: string; data?: { message?: string } }>;
  const responsePayload = axiosError.response?.data;
  const responseMessage = extractApiMessage(responsePayload, '');

  if (responseMessage) {
    const status = axiosError.response?.status;
    return status ? `${responseMessage} (HTTP ${status})` : responseMessage;
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return fallback;
};

export const normalizeRoleName = (role: unknown): UserRole => {
  const normalized = String(role ?? 'CITIZEN').replace(/^ROLE_/, '').toUpperCase();

  if (normalized === 'ADMIN' || normalized === 'LEADER' || normalized === 'CITIZEN') {
    return normalized;
  }

  return 'CITIZEN';
};

export const normalizeReportLevel = (level: string): string => {
  const normalized = level.toUpperCase();

  if (normalized.startsWith('AT_')) {
    return normalized;
  }

  if (normalized === 'VILLAGE') {
    return 'AT_VILLAGE';
  }

  if (normalized === 'CELL') {
    return 'AT_CELL';
  }

  if (normalized === 'SECTOR') {
    return 'AT_SECTOR';
  }

  if (normalized === 'DISTRICT') {
    return 'AT_DISTRICT';
  }

  if (normalized === 'PROVINCE') {
    return 'AT_PROVINCE';
  }

  if (normalized === 'NATIONAL' || normalized === 'AT_NATIONAL') {
    return 'AT_NATIONAL';
  }

  return normalized;
};

