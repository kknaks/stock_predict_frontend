"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { priceService, priceSSEService } from "@/services/price";
import { MinuteCandle, PriceUpdate } from "@/types/predict";
import StockChart from "@/components/chart/StockChart";

type IntervalType = 1 | 10 | 30 | 60;

export default function ChartPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const stockCode = params.stockCode as string;
  const stockName = searchParams.get("name") || "";
  const targetPrice = Number(searchParams.get("target") || 0);
  const stopLossPrice = Number(searchParams.get("stopLoss") || 0);

  const [candles, setCandles] = useState<MinuteCandle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [openPrice, setOpenPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangeRate, setPriceChangeRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [interval, setInterval] = useState<IntervalType>(1);

  // 분봉 데이터 + 장 상태 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];

        // 병렬로 분봉 데이터와 장 상태 조회
        const [candleResponse, marketStatus] = await Promise.all([
          priceService.getMinuteCandles(stockCode, today, interval),
          priceService.getMarketStatus(),
        ]);

        setCandles(candleResponse.candles);
        setIsMarketOpen(marketStatus.is_open);

        // 첫 캔들 시가, 마지막 캔들 종가 설정
        if (candleResponse.candles.length > 0) {
          const firstCandle = candleResponse.candles[0];
          const lastCandle = candleResponse.candles[candleResponse.candles.length - 1];
          setOpenPrice(firstCandle.open);
          setCurrentPrice(lastCandle.close);
          setPriceChange(lastCandle.close - firstCandle.open);
          setPriceChangeRate(((lastCandle.close - firstCandle.open) / firstCandle.open) * 100);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "데이터 로딩 실패");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stockCode, interval]);

  // 실시간 현재가 SSE 연결 (장중일 때만)
  useEffect(() => {
    if (!isMarketOpen) return;

    const handlePriceUpdate = (update: PriceUpdate) => {
      if (update.stock_code === stockCode) {
        const newPrice = Number(update.current_price);
        setCurrentPrice(newPrice);
        setPriceChange(Number(update.price_change));
        setPriceChangeRate(Number(update.price_change_rate));
      }
    };

    priceSSEService.connect([stockCode], handlePriceUpdate);

    return () => {
      priceSSEService.disconnect();
    };
  }, [stockCode, isMarketOpen]);

  const formatPrice = (value: number | null) => {
    if (value === null) return "-";
    return value.toLocaleString();
  };

  const getPriceColor = (value: number) => {
    if (value > 0) return "text-red-500";
    if (value < 0) return "text-blue-500";
    return "text-gray-500";
  };

  const intervals: IntervalType[] = [1, 10, 30, 60];

  return (
    <div className="p-4 pb-4 flex flex-col" style={{ height: 'calc(100vh - 64px - env(safe-area-inset-bottom))' }}>
      {/* 페이지 헤더 */}
      <div className="shrink-0 flex items-center gap-2 mb-4">
        <button
          onClick={() => router.back()}
          className="p-1 -ml-1 text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">차트</h1>
      </div>

      {/* 요약 섹션 - 고정 */}
      <div className="shrink-0 mb-2">
        {/* 종목 정보 */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-lg font-bold">{stockName}</h1>
            <p className="text-xs text-gray-500">{stockCode}</p>
          </div>
          {isMarketOpen && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
              장중
            </span>
          )}
        </div>

        {/* 가격 정보 */}
        <div className="flex items-baseline justify-between">
          <span className={`text-lg font-bold ${getPriceColor(priceChange)}`}>
            {formatPrice(currentPrice)}원
          </span>
          <span className={`text-base font-medium ${getPriceColor(priceChange)}`}>
            {priceChange >= 0 ? "▲" : "▼"} {formatPrice(Math.abs(priceChange))}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>시가 {formatPrice(openPrice)}</span>
          <span className={getPriceColor(priceChangeRate)}>
            {priceChangeRate >= 0 ? "+" : ""}{priceChangeRate.toFixed(2)}%
          </span>
        </div>

        {/* 목표가/손절가 */}
        <div className="flex gap-2 mt-2 text-xs">
          <div className="flex-1 py-1.5 px-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">목표</span>
            <span className="text-red-500 font-medium">{formatPrice(targetPrice)}</span>
          </div>
          <div className="flex-1 py-1.5 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">손절</span>
            <span className="text-blue-500 font-medium">{formatPrice(stopLossPrice)}</span>
          </div>
        </div>
      </div>

      {/* 차트 영역 (캔들 + 거래량 통합) */}
      <div className="flex-1 min-h-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
        {/* 차트 헤더 */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500">차트</span>
          <div className="flex gap-1">
            {intervals.map((i) => (
              <button
                key={i}
                onClick={() => setInterval(i)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  interval === i
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {i}분
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          {loading && (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">로딩 중...</p>
            </div>
          )}
          {error && (
            <div className="h-full flex items-center justify-center">
              <p className="text-red-500">{error}</p>
            </div>
          )}
          {!loading && !error && candles.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">데이터가 없습니다</p>
            </div>
          )}
          {!loading && !error && candles.length > 0 && (
            <StockChart
              candles={candles}
              targetPrice={targetPrice}
              stopLossPrice={stopLossPrice}
            />
          )}
        </div>
      </div>
    </div>
  );
}
