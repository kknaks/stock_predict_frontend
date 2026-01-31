"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { reportService } from "@/services/report";
import { ReportDetailResponse } from "@/types/report";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const version = params.version as string;

  const [report, setReport] = useState<ReportDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await reportService.getDetail(version);
        setReport(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "로딩 실패");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [version]);

  const processContent = (content: string) => {
    return content.replace(
      /!\[([^\]]*)\]\(\/api\/v1\/reports\//g,
      `![$1](${API_URL}/api/v1/reports/`
    );
  };

  return (
    <div className="p-4 pb-20 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">모델 리포트 {version}</h1>
      </div>

      {loading && <p className="text-gray-500">로딩 중...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && report && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">상태:</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {report.status}
            </span>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none prose-img:rounded-lg prose-img:max-w-full prose-table:text-xs prose-th:px-2 prose-td:px-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {processContent(report.content)}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
