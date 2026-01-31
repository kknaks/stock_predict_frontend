"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { reportService } from "@/services/report";
import { ReportListItem } from "@/types/report";

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await reportService.getList();
        setReports(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "로딩 실패");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR");
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds == null) return "-";
    if (seconds < 60) return `${Math.round(seconds)}초`;
    return `${Math.round(seconds / 60)}분`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "archived":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  return (
    <div className="p-4 pb-20 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">AI 모델 이력</h1>
      </div>

      {loading && <p className="text-gray-500">로딩 중...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 text-xs">
                <th className="px-4 py-3 text-left">버전</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-right">학습 데이터</th>
                <th className="px-4 py-3 text-right">샘플 수</th>
                <th className="px-4 py-3 text-right">학습 시간</th>
                <th className="px-4 py-3 text-right">생성일</th>
                <th className="px-4 py-3 text-center">결과</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-50 dark:border-gray-800 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{r.version}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(r.status)}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {r.training_data_start && r.training_data_end
                      ? `${r.training_data_start} ~ ${r.training_data_end}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {r.training_samples?.toLocaleString() ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {formatDuration(r.training_duration_seconds)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => router.push(`/settings/reports/${r.version}`)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      리포트
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    등록된 모델이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
