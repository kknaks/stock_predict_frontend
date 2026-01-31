import { api } from "./api";
import { authService } from "./auth";
import { ReportListResponse, ReportDetailResponse } from "@/types/report";

export const reportService = {
  async getList(): Promise<ReportListResponse> {
    const token = authService.getAccessToken();
    return api.get<ReportListResponse>("/api/v1/reports", { token: token || undefined });
  },

  async getDetail(version: string): Promise<ReportDetailResponse> {
    const token = authService.getAccessToken();
    return api.get<ReportDetailResponse>(`/api/v1/reports/${version}`, {
      token: token || undefined,
    });
  },
};
