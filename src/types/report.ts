export interface ReportListItem {
  id: number;
  version: string;
  status: string;
  trigger_type: string | null;
  training_samples: number | null;
  training_data_start: string | null;
  training_data_end: string | null;
  training_duration_seconds: number | null;
  created_at: string | null;
  activated_at: string | null;
}

export interface ReportListResponse {
  data: ReportListItem[];
}

export interface ReportDetailResponse {
  version: string;
  status: string;
  content: string;
}
