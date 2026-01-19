"use client";

import { useEffect, useState } from "react";
import { predictService } from "@/services/predict";
import { PredictionItem } from "@/types/predict";

export default function PredictPage() {
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const fetchPredictions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await predictService.getList(date);
      setPredictions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로딩 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [date]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "BUY":
        return "bg-red-100 text-red-700";
      case "SELL":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getConfidenceColor = (confidence: string | null) => {
    switch (confidence) {
      case "HIGH":
        return "text-green-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "LOW":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatProb = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">예측</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      {loading && <p className="text-gray-500">로딩 중...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && predictions.length === 0 && (
        <p className="text-gray-500">해당 날짜의 예측 데이터가 없습니다.</p>
      )}

      <div className="space-y-3">
        {predictions.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            {/* 헤더: 종목명, 시그널 */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-bold text-lg">{item.stock_name}</span>
                <span className="text-gray-500 text-sm ml-2">{item.stock_code}</span>
                {item.exchange && (
                  <span className="text-gray-400 text-xs ml-1">({item.exchange})</span>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getSignalColor(item.signal)}`}
              >
                {item.signal}
              </span>
            </div>

            {/* 확률 */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                <span className="text-gray-500">상승확률</span>
                <span className="float-right font-medium text-red-600">
                  {formatProb(item.prob_up)}
                </span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                <span className="text-gray-500">하락확률</span>
                <span className="float-right font-medium text-blue-600">
                  {formatProb(item.prob_down)}
                </span>
              </div>
            </div>

            {/* 수익률 정보 */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="text-gray-500 text-xs">기대수익</div>
                <div className={`font-medium ${item.expected_return >= 0 ? "text-red-600" : "text-blue-600"}`}>
                  {formatPercent(item.expected_return)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-xs">상승시</div>
                <div className="font-medium text-red-600">
                  {formatPercent(item.return_if_up)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-xs">하락시</div>
                <div className="font-medium text-blue-600">
                  {formatPercent(item.return_if_down)}
                </div>
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-xs text-gray-500">
              <span>시가: {item.stock_open.toLocaleString()}원</span>
              <span>갭: {formatPercent(item.gap_rate)}</span>
              <span className={getConfidenceColor(item.confidence)}>
                {item.confidence || "-"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
