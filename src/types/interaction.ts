export interface HistoryResponseDTO {
  action: string;
  notes: string;
  timestamp: string;
  actedBy: string;
}

export interface FeedbackRequestDTO {
  rating: number;
  comment: string;
}

