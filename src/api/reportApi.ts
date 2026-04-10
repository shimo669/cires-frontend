import type { CreateReportRequest, Report as ReportDTO } from '../types/report';
import api from './axios';

const unwrapData = <T>(payload: unknown): T => {
  const wrapped = payload as { data?: T };
  return wrapped.data ?? (payload as T);
};

export const createReport = async (request: CreateReportRequest) => {
  const response = await api.post('/reports', request);
  return response.data;
};

export const getMyReports = async (): Promise<ReportDTO[]> => {
  const response = await api.get('/reports/my-reports');
  return unwrapData<ReportDTO[]>(response.data);
};

export const getReportsByLevel = async (level: string): Promise<ReportDTO[]> => {
  const response = await api.get(`/reports/level/${level}`);
  return unwrapData<ReportDTO[]>(response.data);
};

export const resolveReport = async (id: number) => {
  const response = await api.put(`/reports/${id}/resolve`);
  return response.data;
};

export const escalateReport = async (id: number) => {
  const response = await api.put(`/reports/${id}/escalate`);
  return response.data;
};
