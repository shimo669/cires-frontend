import type { FeedbackRequestDTO, HistoryResponseDTO } from '../types/interaction';
import api from './axios';

const unwrapData = <T>(payload: unknown): T => {
  const wrapped = payload as { data?: T };
  return wrapped.data ?? (payload as T);
};

export const getReportHistory = async (reportId: number): Promise<HistoryResponseDTO[]> => {
  const response = await api.get(`/interactions/reports/${reportId}/history`);
  return unwrapData<HistoryResponseDTO[]>(response.data);
};

export const submitFeedback = async (reportId: number, data: FeedbackRequestDTO): Promise<string> => {
  const response = await api.post(`/interactions/reports/${reportId}/feedback`, data);
  const payload = response.data as { message?: string; data?: { message?: string } };
  return payload.message ?? payload.data?.message ?? 'Feedback submitted successfully.';
};

