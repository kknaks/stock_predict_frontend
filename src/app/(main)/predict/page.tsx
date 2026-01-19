"use client";

import { useEffect, useState, useCallback } from "react";
import { predictService } from "@/services/predict";
import { priceSSEService } from "@/services/price";
import { StrategyPrediction, PredictionItem, PriceUpdate } from "@/types/predict";

export default function PredictPage() {
  const [strategies, setStrategies] = useState<StrategyPrediction[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const handlePriceUpdate = useCallback((update: PriceUpdate) => {
    setStrategies((prev) =>
      prev.map((strategy) => ({
        ...strategy,
        predictions: strategy.predictions.map((item) =>
          item.stock_code === update.stock_code
            ? { ...item, current_price: update.current_price }
            : item
        ),
      }))
    );
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await predictService.getList(date);
      setStrategies(response.data);
      setIsMarketOpen(response.is_market_open);
      if (response.data.length > 0) {
        setActiveTab(response.data[0].strategy_info.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로딩 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [date]);

  // SSE 연결 관리
  useEffect(() => {
    if (!isMarketOpen || strategies.length === 0) {
      priceSSEService.disconnect();
      return;
    }

    // 모든 종목 코드 수집
    const stockCodes = strategies.flatMap((strategy) =>
      strategy.predictions.map((item) => item.stock_code)
    );
    const uniqueCodes = [...new Set(stockCodes)];

    if (uniqueCodes.length > 0) {
      priceSSEService.connect(uniqueCodes, handlePriceUpdate);
    }

    return () => {
      priceSSEService.disconnect();
    };
  }, [isMarketOpen, strategies.length, handlePriceUpdate]);

  const formatPrice = (value: number | null) => {
    if (value === null) return "-";
    return value.toLocaleString();
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "-";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const getReturnColor = (value: number | null) => {
    if (value === null) return "text-gray-500";
    return value >= 0 ? "text-red-500" : "text-blue-500";
  };

  const calculateReturn = (item: PredictionItem) => {
    // 현재가가 있으면 시가 대비 수익률 계산
    if (item.current_price && item.stock_open > 0) {
      return ((item.current_price - item.stock_open) / item.stock_open) * 100;
    }
    // 실제 수익률이 있으면 사용
    if (item.actual_return !== null) {
      return item.actual_return;
    }
    // 기대 수익률 사용
    return item.expected_return;
  };

  const renderPredictionItem = (item: PredictionItem) => {
    const currentReturn = calculateReturn(item);
    const isUp = currentReturn >= 0;
    const displayPrice = item.current_price ?? item.stock_open;

    return (
      <div
        key={item.id}
        className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
      >
        {/* 1행: 종목 | 현재가 | 시작가 | 등락률 */}
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            <span className="font-bold text-base truncate">{item.stock_name}</span>
          </div>
          <div className={`w-24 flex items-center justify-end font-bold ${getReturnColor(currentReturn)}`}>
            <span>{formatPrice(displayPrice)}</span>
            <span className="ml-0.5 text-[10px]">{isUp ? "▲" : "▼"}</span>
          </div>
          <div className="w-24 text-right text-gray-600 dark:text-gray-400">
            {formatPrice(item.stock_open)}
          </div>
          <div className={`w-20 text-right font-bold ${getReturnColor(currentReturn)}`}>
            {formatPercent(currentReturn)}
          </div>
        </div>

        {/* 2행: 시장명 코드명 | 최고 예측 | 최저 예측 | 상승확률 */}
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <div className="flex-1 min-w-0 whitespace-nowrap">
            {item.exchange || "KRX"} {item.stock_code}
          </div>
          <div className="w-24 flex justify-end">
            <span className="text-red-400">{formatPercent(item.max_return_if_up)}</span>
          </div>
          <div className="w-24 flex justify-end">
            <span className="text-blue-400">{formatPercent(item.return_if_down)}</span>
          </div>
          <div className="w-20 flex justify-end">
            <span className="text-green-500">{(item.prob_up * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">예측</h1>
          {isMarketOpen && (
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
              장중
            </span>
          )}
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      {loading && <p className="text-gray-500">로딩 중...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && strategies.length === 0 && (
        <p className="text-gray-500">해당 날짜의 예측 데이터가 없습니다.</p>
      )}

      {/* 전략 카드 */}
      {strategies.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
          {/* 탭 헤더 */}
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {strategies.map((strategy) => (
              <button
                key={strategy.strategy_info.id}
                onClick={() => setActiveTab(strategy.strategy_info.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === strategy.strategy_info.id
                    ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {strategy.strategy_info.description}
              </button>
            ))}
          </div>

          {/* 선택된 전략 내용 */}
          {strategies
            .filter((strategy) => strategy.strategy_info.id === activeTab)
            .map((strategy) => (
              <div key={strategy.strategy_info.id}>
                {/* 테이블 헤더 */}
                <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0">종목명</div>
                    <div className="w-24 text-right">현재가</div>
                    <div className="w-24 text-right">시작가</div>
                    <div className="w-20 text-right">등락률</div>
                  </div>
                  <div className="flex items-center mt-1">
                    <div className="flex-1 min-w-0">시장 코드명</div>
                    <div className="w-24 text-right">최고 예측</div>
                    <div className="w-24 text-right">최저 예측</div>
                    <div className="w-20 text-right">상승확률</div>
                  </div>
                </div>

                {/* 예측 목록 */}
                <div className="px-4">
                  {strategy.predictions.length === 0 ? (
                    <p className="py-4 text-center text-gray-500 text-sm">예측 데이터 없음</p>
                  ) : (
                    strategy.predictions.map(renderPredictionItem)
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
