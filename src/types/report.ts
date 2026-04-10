import type { AddressHierarchyRequest } from './geo';

export type ReportStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';

export interface CreateReportRequest extends AddressHierarchyRequest {
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;
  incidentLocationId: number;
  incidentLocationName: string;
  slaDeadline: string;
}

export interface Report {
  report_id: number;
  title: string;
  description: string;
  status: ReportStatus;
  category_name: string;
  incident_village: string;
  current_escalation_level: string;
  sla_deadline: string; // ISO Date string
  created_at: string;
}

