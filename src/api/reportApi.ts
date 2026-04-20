import type { CreateReportRequest, Report as ReportDTO } from '../types/report';
import api from './axios';
import { normalizeReportLevel, unwrapApiData } from './responseUtils';

const normalizeStatus = (status: unknown): ReportDTO['status'] => {
  const value = String(status ?? 'PENDING').toUpperCase();

  if (
    value === 'OPEN' ||
    value === 'PENDING' ||
    value === 'IN_PROGRESS' ||
    value === 'PENDING_CONFIRMATION' ||
    value === 'RESOLVED' ||
    value === 'ESCALATED' ||
    value === 'REOPENED'
  ) {
    return value;
  }

  return 'PENDING';
};

const normalizeReport = (raw: unknown): ReportDTO => {
  const report = raw as Record<string, unknown>;

  const id = Number(report.report_id ?? report.id ?? 0);
  const category =
    (report.category_name as string | undefined) ??
    (report.categoryName as string | undefined) ??
    (report.category as { name?: string } | undefined)?.name ??
    'N/A';
  const location =
    (report.incident_village as string | undefined) ??
    (report.incidentVillage as string | undefined) ??
    (report.villageName as string | undefined) ??
    (report.incidentLocationName as string | undefined) ??
    'N/A';
  const deadline =
    (report.sla_deadline as string | undefined) ??
    (report.deadlineDate as string | undefined) ??
    (report.slaDeadline as string | undefined) ??
    '';
  const createdAt = (report.created_at as string | undefined) ?? (report.createdAt as string | undefined) ?? new Date().toISOString();

  return {
    report_id: id,
    id,
    title: String(report.title ?? 'Untitled issue'),
    description: String(report.description ?? ''),
    status: normalizeStatus(report.status),
    categoryId: Number(report.categoryId ?? report.category_id ?? 0) || undefined,
    villageId: Number(report.villageId ?? report.village_id ?? report.incidentLocationId ?? 0) || undefined,
    category_name: category,
    incident_village: location,
    current_escalation_level: String(report.current_escalation_level ?? report.currentEscalationLevel ?? report.levelType ?? 'AT_VILLAGE'),
    sla_deadline: deadline,
    deadline_date: (report.deadline_date as string | undefined) ?? (report.deadlineDate as string | undefined) ?? deadline,
    created_at: createdAt,
    reporter_username: (report.reporter_username as string | undefined) ?? (report.reporterUsername as string | undefined),
    feedback_rating: Number(report.feedback_rating ?? report.feedbackRating ?? 0) || undefined,
  };
};

const normalizeReportList = (payload: unknown): ReportDTO[] => {
  const rows = unwrapApiData<unknown[]>(payload);
  return Array.isArray(rows) ? rows.map(normalizeReport) : [];
};

export const createReport = async (request: CreateReportRequest) => {
  const payload = {
    title: request.title,
    description: request.description,
    categoryId: request.categoryId,
    villageId: request.villageId,
  };

  const response = await api.post('/reports', payload);
  return response.data;
};

export const getMyReports = async (): Promise<ReportDTO[]> => {
  const response = await api.get('/reports/my-reports');
  return normalizeReportList(response.data);
};

export const getReportsByLevel = async (level: string): Promise<ReportDTO[]> => {
  const normalizedLevel = normalizeReportLevel(level);
  const response = await api.get(`/reports/level/${normalizedLevel}`);
  return normalizeReportList(response.data);
};

export const getAdminReports = async (): Promise<ReportDTO[]> => {
  const response = await api.get('/admin/reports');
  return normalizeReportList(response.data);
};

export const getMyJurisdictionReports = async (leaderLevelType?: string): Promise<ReportDTO[]> => {
  try {
    const response = await api.get('/leader/reports');
    return normalizeReportList(response.data);
  } catch (error) {
    try {
      const legacyResponse = await api.get('/reports/leader/my-jurisdiction');
      return normalizeReportList(legacyResponse.data);
    } catch {
      // continue to level fallback below
    }

    if (!leaderLevelType) {
      throw error;
    }

    const fallback = await getReportsByLevel(leaderLevelType);
    return fallback;
  }
};

export const resolveReport = async (id: number) => {
  const response = await api.put(`/reports/${id}/resolve`);
  return response.data;
};

export const escalateReport = async (id: number) => {
  const response = await api.put(`/reports/${id}/escalate`);
  return response.data;
};

export const confirmReport = async (id: number) => {
  const response = await api.put(`/reports/${id}/confirm`);
  return response.data;
};

export const denyReport = async (id: number) => {
  const response = await api.put(`/reports/${id}/deny`);
  return response.data;
};

