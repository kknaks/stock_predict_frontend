"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

  const renderMarkdown = (content: string) => {
    // 이미지 경로에 API_URL prefix 추가
    const processed = content.replace(
      /!\[([^\]]*)\]\(\/api\/v1\/reports\//g,
      `![$1](${API_URL}/api/v1/reports/`
    );

    return processed.split("\n").map((line, i) => {
      // 이미지
      const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        return (
          <img
            key={i}
            src={imgMatch[2]}
            alt={imgMatch[1]}
            className="max-w-full rounded-lg my-4"
          />
        );
      }

      // 헤더
      if (line.startsWith("### "))
        return <h3 key={i} className="text-base font-semibold mt-6 mb-2">{line.slice(4)}</h3>;
      if (line.startsWith("## "))
        return <h2 key={i} className="text-lg font-bold mt-8 mb-3">{line.slice(3)}</h2>;
      if (line.startsWith("# "))
        return <h1 key={i} className="text-xl font-bold mt-8 mb-4">{line.slice(2)}</h1>;

      // 구분선
      if (line.match(/^---+$/))
        return <hr key={i} className="my-6 border-gray-200 dark:border-gray-700" />;

      // 코드블록 (간단 처리)
      if (line.startsWith("```"))
        return null;

      // 빈 줄
      if (line.trim() === "") return <div key={i} className="h-2" />;

      // 리스트
      if (line.match(/^[-*] /))
        return <li key={i} className="ml-4 text-sm text-gray-700 dark:text-gray-300">{line.slice(2)}</li>;

      // 일반 텍스트
      return <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{line}</p>;
    });
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
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-500">상태:</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {report.status}
            </span>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            {renderMarkdown(report.content)}
          </div>
        </div>
      )}
    </div>
  );
}
