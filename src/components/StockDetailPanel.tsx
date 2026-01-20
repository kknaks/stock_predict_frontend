"use client";

import { useEffect, useRef } from "react";
import { PredictionItem, PriceUpdate } from "@/types/predict";

interface StockDetailPanelProps {
  stock: PredictionItem;
  priceData?: PriceUpdate;
  priceHistory: PriceUpdate[];
  onClose: () => void;
}

export default function StockDetailPanel({
  stock,
  priceData,
  priceHistory,
  onClose,
}: StockDetailPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 현재가 (실시간 데이터 또는 예측 데이터)
  const currentPrice = priceData
    ? Number(priceData.current_price)
    : stock.current_price ?? stock.stock_open;

  // 등락폭, 등락률
  const priceChange = priceData
    ? Number(priceData.price_change)
    : currentPrice - stock.stock_open;
  const priceChangeRate = priceData
    ? Number(priceData.price_change_rate)
    : stock.stock_open > 0
    ? ((currentPrice - stock.stock_open) / stock.stock_open) * 100
    : 0;
  const priceChangeSign = priceData?.price_change_sign || (priceChange >= 0 ? "2" : "5");

  // 시가, 고가, 저가
  const openPrice = priceData ? Number(priceData.open_price) : stock.stock_open;
  const highPrice = priceData ? Number(priceData.high_price) : stock.actual_high ?? stock.stock_open;
  const lowPrice = priceData ? Number(priceData.low_price) : stock.actual_low ?? stock.stock_open;

  // 거래량
  const volume = priceData ? Number(priceData.accumulated_volume) : 0;
  const volumeRatio = priceData ? Number(priceData.volume_ratio) : 0;

  // 체결강도
  const tradeStrength = priceData ? Number(priceData.trade_strength) : 0;

  // 색상 결정 (상승: 빨강, 하락: 파랑)
  const isUp = priceChange >= 0;
  const priceColor = isUp ? "text-red-500" : "text-blue-500";
  const bgColor = isUp ? "bg-red-50 dark:bg-red-900/20" : "bg-blue-50 dark:bg-blue-900/20";

  // 등락 부호
  const getChangeSymbol = (sign: string) => {
    switch (sign) {
      case "1":
        return "▲"; // 상한
      case "2":
        return "▲"; // 상승
      case "3":
        return ""; // 보합
      case "4":
        return "▼"; // 하한
      case "5":
        return "▼"; // 하락
      default:
        return isUp ? "▲" : "▼";
    }
  };

  // 시가/고가/저가 대비 현재가 등락률 계산
  const calcChangeRate = (basePrice: number) => {
    if (basePrice === 0) return 0;
    return ((currentPrice - basePrice) / basePrice) * 100;
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString();
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "-";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatVolume = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(2)}억`;
    }
    if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만`;
    }
    return value.toLocaleString();
  };

  // 차트 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || priceHistory.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 10, right: 10, bottom: 20, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 데이터 추출
    const prices = priceHistory.map((p) => Number(p.current_price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // 배경 지우기
    ctx.clearRect(0, 0, width, height);

    // 기준선 (시가)
    const openY = padding.top + chartHeight * (1 - (openPrice - minPrice) / priceRange);
    ctx.strokeStyle = "#9CA3AF";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, openY);
    ctx.lineTo(width - padding.right, openY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 가격 라인
    ctx.strokeStyle = isUp ? "#EF4444" : "#3B82F6";
    ctx.lineWidth = 2;
    ctx.beginPath();

    prices.forEach((price, i) => {
      const x = padding.left + (i / (prices.length - 1)) * chartWidth;
      const y = padding.top + chartHeight * (1 - (price - minPrice) / priceRange);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // 그라데이션 채우기
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    if (isUp) {
      gradient.addColorStop(0, "rgba(239, 68, 68, 0.3)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
    } else {
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
      gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    prices.forEach((price, i) => {
      const x = padding.left + (i / (prices.length - 1)) * chartWidth;
      const y = padding.top + chartHeight * (1 - (price - minPrice) / priceRange);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fill();

    // 시간 라벨
    if (priceHistory.length > 0) {
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";

      const firstTime = priceHistory[0].trade_time;
      const lastTime = priceHistory[priceHistory.length - 1].trade_time;

      const formatTime = (t: string) => `${t.slice(0, 2)}:${t.slice(2, 4)}`;

      ctx.fillText(formatTime(firstTime), padding.left + 20, height - 5);
      ctx.fillText(formatTime(lastTime), width - padding.right - 20, height - 5);
    }
  }, [priceHistory, openPrice, isUp]);

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* 패널 */}
      <div className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{stock.stock_code}</p>
              <h2 className="text-lg font-bold">{stock.stock_name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 현재가 섹션 */}
        <div className={`p-4 ${bgColor}`}>
          <div className={`text-3xl font-bold ${priceColor}`}>
            {formatPrice(currentPrice)}
          </div>
          <div className={`flex items-center gap-2 mt-1 ${priceColor}`}>
            <span>{getChangeSymbol(priceChangeSign)}</span>
            <span>{formatPrice(Math.abs(priceChange))}</span>
            <span>{formatPercent(priceChangeRate)}</span>
          </div>
        </div>

        {/* 차트 */}
        <div className="p-4">
          <div className="h-40 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
            {priceHistory.length >= 2 ? (
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                차트 데이터 수집 중...
              </div>
            )}
          </div>
        </div>

        {/* 거래량 */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">거래량 (전일대비)</span>
            <div className="text-right">
              <span className="font-medium">{formatVolume(volume)}</span>
              <span className="text-gray-500 text-sm ml-2">{volumeRatio.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* 시가/고가/저가 */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">시가</div>
              <div className="font-medium">{formatPrice(openPrice)}</div>
              <div className={`text-xs ${calcChangeRate(openPrice) >= 0 ? "text-red-500" : "text-blue-500"}`}>
                {formatPercent(calcChangeRate(openPrice))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">고가</div>
              <div className="font-medium text-red-500">{formatPrice(highPrice)}</div>
              <div className="text-xs text-red-500">
                {formatPercent(calcChangeRate(highPrice))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">저가</div>
              <div className="font-medium text-blue-500">{formatPrice(lowPrice)}</div>
              <div className="text-xs text-blue-500">
                {formatPercent(calcChangeRate(lowPrice))}
              </div>
            </div>
          </div>
        </div>

        {/* 체결강도 */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">체결강도</span>
            <span className={`font-medium ${tradeStrength >= 100 ? "text-red-500" : "text-blue-500"}`}>
              {tradeStrength.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 예측 정보 */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 mb-20">
          <div className="text-xs text-gray-500 mb-2">AI 예측</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">상승확률</div>
              <div className="font-medium text-green-500">{(stock.prob_up * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-gray-500">예상 최고</div>
              <div className="font-medium text-red-500">{formatPercent(stock.max_return_if_up)}</div>
            </div>
            <div>
              <div className="text-gray-500">예상 최저</div>
              <div className="font-medium text-blue-500">{formatPercent(stock.return_if_down)}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
