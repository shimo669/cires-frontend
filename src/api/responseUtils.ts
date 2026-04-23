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

  const aliases: Record<string, string> = {
    AT_VILLAGE: 'AT_VILLAGE',
    VILLAGE: 'AT_VILLAGE',
    VILLAGE_LEADER: 'AT_VILLAGE',
    AT_CELL: 'AT_CELL',
    CELL: 'AT_CELL',
    CELL_LEADER: 'AT_CELL',
    AT_SECTOR: 'AT_SECTOR',
    SECTOR: 'AT_SECTOR',
    SECTOR_LEADER: 'AT_SECTOR',
    AT_DISTRICT: 'AT_DISTRICT',
    DISTRICT: 'AT_DISTRICT',
    DISTRICT_LEADER: 'AT_DISTRICT',
    DISTRICT_MAYOR: 'AT_DISTRICT',
    AT_PROVINCE: 'AT_PROVINCE',
    PROVINCE: 'AT_PROVINCE',
    PROVINCE_LEADER: 'AT_PROVINCE',
    PROVINCE_GOVERNOR: 'AT_PROVINCE',
    AT_NATIONAL: 'AT_NATIONAL',
    NATIONAL: 'AT_NATIONAL',
    NATIONAL_ADMIN: 'AT_NATIONAL',
  };

  if (aliases[normalized]) {
    return aliases[normalized];
  }

  if (normalized.startsWith('AT_')) {
    return normalized;
  }


  return normalized;
};

