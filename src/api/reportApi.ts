import type { CreateReportRequest, Report as ReportDTO, ReporterConfirmationRequest } from '../types/report';
import api from './axios';
import { normalizeReportLevel, unwrapApiData } from './responseUtils';

const normalizeStatus = (status: unknown): ReportDTO['status'] => {
  const value = String(status ?? 'PENDING').toUpperCase();

  if (
    value === 'OPEN' ||
    value === 'PENDING' ||
    value === 'IN_PROGRESS' ||
    value === 'PENDING_CONFIRMATION' ||
    value === 'PENDING_REPORTER_CONFIRMATION' ||
    value === 'RESOLVED' ||
    value === 'ESCALATED' ||
    value === 'REOPENED' ||
    value === 'NEVER_SOLVED'
  ) {
    return value;
  }

  if (value === 'SOLVED' || value === 'CONFIRMED' || value === 'CLOSED') {
    return 'RESOLVED';
  }

  if (value === 'PENDING_CITIZEN_CONFIRMATION') {
    return 'PENDING_CONFIRMATION';
  }

  if (value === 'UNRESOLVED' || value === 'FAILED_PERMANENTLY') {
    return 'NEVER_SOLVED';
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
  const escalationLevel = normalizeReportLevel(
    String(report.current_escalation_level ?? report.currentEscalationLevel ?? report.levelType ?? 'AT_VILLAGE'),
  );
  const deadline =
    (report.sla_deadline as string | undefined) ??
    (report.deadlineDate as string | undefined) ??
    (report.slaDeadline as string | undefined) ??
    '';
  const createdAt = (report.created_at as string | undefined) ?? (report.createdAt as string | undefined) ?? new Date().toISOString();
  const normalizedStatus = normalizeStatus(report.status);
  const reporterConfirmationRequired =
    (report.reporterConfirmationRequired as boolean | undefined) ??
    (report.reporter_confirmation_required as boolean | undefined) ??
    (normalizedStatus === 'PENDING_REPORTER_CONFIRMATION' || normalizedStatus === 'PENDING_CONFIRMATION');

  return {
    report_id: id,
    id,
    title: String(report.title ?? 'Untitled issue'),
    description: String(report.description ?? ''),
    status: normalizedStatus,
    categoryId: Number(report.categoryId ?? report.category_id ?? 0) || undefined,
    villageId: Number(report.villageId ?? report.village_id ?? report.incidentLocationId ?? 0) || undefined,
    category_name: category,
    incident_village: location,
    current_escalation_level: escalationLevel,
    sla_deadline: deadline,
    deadline_date: (report.deadline_date as string | undefined) ?? (report.deadlineDate as string | undefined) ?? deadline,
    created_at: createdAt,
    reporter_id:
      Number(report.reporter_id ?? report.reporterId ?? report.user_id ?? report.userId ?? 0) || undefined,
    reporter_username: (report.reporter_username as string | undefined) ?? (report.reporterUsername as string | undefined),
    feedback_rating: Number(report.feedback_rating ?? report.feedbackRating ?? 0) || undefined,
    reporterConfirmationRequired,
    reporterApproved:
      (report.reporterApproved as boolean | null | undefined) ??
      (report.reporter_approved as boolean | null | undefined) ??
      null,
    serviceRating: Number(report.serviceRating ?? report.service_rating ?? report.feedbackRating ?? 0) || null,
    serviceComment:
      (report.serviceComment as string | null | undefined) ??
      (report.service_comment as string | null | undefined) ??
      (report.feedbackComment as string | null | undefined) ??
      null,
    reporterConfirmedAt:
      (report.reporterConfirmedAt as string | null | undefined) ??
      (report.reporter_confirmed_at as string | null | undefined) ??
      null,
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
    ...(request.categoryName ? { categoryName: request.categoryName } : {}),
    ...(request.incidentLocationId ? { incidentLocationId: request.incidentLocationId } : {}),
    ...(request.incidentLocationName ? { incidentLocationName: request.incidentLocationName } : {}),
    ...(request.provinceId ? { provinceId: request.provinceId } : {}),
    ...(request.districtId ? { districtId: request.districtId } : {}),
    ...(request.sectorId ? { sectorId: request.sectorId } : {}),
    ...(request.cellId ? { cellId: request.cellId } : {}),
    villageId: request.villageId,
  };

  const response = await api.post('/reports', payload);
  return response.data;
};

export const getMyReports = async (): Promise<ReportDTO[]> => {
  const response = await api.get('/reports/my-reports');
  return normalizeReportList(response.data);
};


export const getAdminReports = async (): Promise<ReportDTO[]> => {
  const response = await api.get('/admin/reports');
  return normalizeReportList(response.data);
};

export const getMyJurisdictionReports = async (leaderLevelType?: string): Promise<ReportDTO[]> => {
  const normalizedLevel = leaderLevelType ? normalizeReportLevel(leaderLevelType) : '';
  const attempts: Array<() => Promise<{ data?: unknown }>> = [];

  if (normalizedLevel) {
    attempts.push(() => api.get(`/reports/level/${normalizedLevel}`));
  }

  attempts.push(() => api.get('/leader/reports'));
  attempts.push(() => api.get('/reports/leader/my-jurisdiction'));

  let lastError: unknown;
  let emptySuccess: ReportDTO[] | null = null;

  for (const attempt of attempts) {
    try {
      const response = await attempt();
      const data = normalizeReportList(response.data);

      if (data.length > 0) {
        return data;
      }

      if (emptySuccess === null) {
        emptySuccess = data;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (emptySuccess !== null) {
    return emptySuccess;
  }

  if (lastError) {
    throw lastError;
  }

  return [];
};

export const resolveReport = async (id: number) => {
  const response = await api.put(`/reports/${id}/resolve`);
  return response.data;
};

export const escalateReport = async (id: number) => {
  const response = await api.put(`/reports/${id}/escalate`);
  return response.data;
};

export const confirmReport = async (id: number, payload: ReporterConfirmationRequest) => {
  const response = await api.put(`/reports/${id}/confirm`, payload);
  return response.data;
};

export const denyReport = async (id: number) => {
  return confirmReport(id, { approved: false });
};

