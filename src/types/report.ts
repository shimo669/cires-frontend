export type ReportStatus =
  | 'OPEN'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'PENDING_CONFIRMATION'
  | 'RESOLVED'
  | 'ESCALATED'
  | 'REOPENED';

export interface CreateReportRequest {
  title: string;
  description: string;
  categoryId: number;
  villageId: number;
}

export interface Report {
  report_id: number;
  id?: number;
  title: string;
  description: string;
  status: ReportStatus;
  categoryId?: number;
  villageId?: number;
  category_name: string;
  incident_village: string;
  current_escalation_level: string;
  sla_deadline: string;
  deadline_date?: string;
  created_at: string;
  reporter_username?: string;
  feedback_rating?: number;
}

