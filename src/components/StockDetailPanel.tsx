"use client";

import { useEffect, useRef, useState } from "react";
import { PredictionItem, PriceUpdate, StockMetadata, HourCandle } from "@/types/predict";
import { stockService } from "@/services/stock";
import { priceService } from "@/services/price";

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
  const [metadata, setMetadata] = useState<StockMetadata | null>(null);
  const [hourCandles, setHourCandles] = useState<HourCandle[]>([]);
  const [candleSource, setCandleSource] = useState<string>("");

  // 오늘 날짜인지 확인
  const today = new Date().toISOString().split("T")[0];
  const isToday = stock.prediction_date === today;

  // 메타데이터 조회 (시가총액)
  useEffect(() => {
    stockService
      .getMetadata(stock.stock_code)
      .then(setMetadata)
      .catch((err) => console.error("Failed to fetch metadata:", err));
  }, [stock.stock_code]);

  // 시간봉 데이터 조회 (API)
  useEffect(() => {
    const fetchCandles = async () => {
      try {
        if (isToday) {
          // 오늘: /today API (캐시 우선)
          const response = await priceService.getTodayCandles(stock.stock_code);
          setHourCandles(response.candles);
          setCandleSource(response.source);
        } else {
          // 과거: 해당 날짜로 DB 조회
          const response = await priceService.getCandlesByDate(stock.stock_code, stock.prediction_date);
          setHourCandles(response.candles);
          setCandleSource(response.source);
        }
      } catch (err) {
        console.error("Failed to fetch hour candles:", err);
      }
    };

    fetchCandles();
  }, [stock.stock_code, stock.prediction_date, isToday]);

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

  const formatMarketCap = (value: number | null) => {
    if (value === null) return "-";
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(2)}조원`;
    }
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(0)}억원`;
    }
    return `${value.toLocaleString()}원`;
  };

  // 틱 데이터를 시간 봉(OHLC)으로 변환
  const getHourlyCandles = (history: PriceUpdate[]) => {
    if (history.length === 0) return [];

    // 시간별로 그룹화 (09~15시)
    const hourlyData: { [hour: number]: PriceUpdate[] } = {};

    history.forEach((tick) => {
      const hour = parseInt(tick.trade_time.slice(0, 2), 10);
      // 09시 ~ 15시 데이터만 사용 (장 마감 15:30이지만 15시 봉까지)
      if (hour >= 9 && hour <= 15) {
        if (!hourlyData[hour]) {
          hourlyData[hour] = [];
        }
        hourlyData[hour].push(tick);
      }
    });

    // OHLC 캔들 생성
    const candles: { hour: number; open: number; high: number; low: number; close: number }[] = [];

    for (let hour = 9; hour <= 15; hour++) {
      const ticks = hourlyData[hour];
      if (ticks && ticks.length > 0) {
        const prices = ticks.map((t) => Number(t.current_price));
        candles.push({
          hour,
          open: prices[0],
          high: Math.max(...prices),
          low: Math.min(...prices),
          close: prices[prices.length - 1],
        });
      }
    }

    return candles;
  };

  // 차트 그리기 (시간 봉 캔들스틱)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // API 시간봉 또는 실시간 틱 데이터 확인
    const hasApiCandles = hourCandles.length > 0;
    const hasRealtimeTicks = priceHistory.length >= 2;

    if (!hasApiCandles && !hasRealtimeTicks) return;

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

    // 배경 지우기
    ctx.clearRect(0, 0, width, height);

    // 시간봉 데이터 결정: API 데이터 우선, 없으면 실시간 틱에서 계산
    let candles: { hour: number; open: number; high: number; low: number; close: number }[];

    if (hasApiCandles) {
      // API에서 가져온 시간봉 사용
      candles = hourCandles.map((c) => ({
        hour: c.hour,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      // 오늘이고 실시간 틱이 있으면, 현재 시간봉 업데이트
      if (isToday && hasRealtimeTicks) {
        const realtimeCandles = getHourlyCandles(priceHistory);
        realtimeCandles.forEach((rc) => {
          const existingIdx = candles.findIndex((c) => c.hour === rc.hour);
          if (existingIdx >= 0) {
            // 기존 캔들 업데이트 (실시간 데이터로)
            candles[existingIdx] = rc;
          } else {
            // 새 시간대 캔들 추가
            candles.push(rc);
          }
        });
        candles.sort((a, b) => a.hour - b.hour);
      }
    } else {
      // 실시간 틱에서 시간봉 계산
      candles = getHourlyCandles(priceHistory);
    }

    if (candles.length === 0) {
      // 데이터 없으면 기존 라인 차트로 대체
      if (!hasRealtimeTicks) return;
      const prices = priceHistory.map((p) => Number(p.current_price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice || 1;

      ctx.strokeStyle = isUp ? "#EF4444" : "#3B82F6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      prices.forEach((price, i) => {
        const x = padding.left + (i / (prices.length - 1)) * chartWidth;
        const y = padding.top + chartHeight * (1 - (price - minPrice) / priceRange);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      return;
    }

    // 전체 가격 범위 계산
    const allPrices = candles.flatMap((c) => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    // 09시~15시까지 7개 봉 (총 슬롯)
    const totalSlots = 7;
    const candleWidth = chartWidth / totalSlots;
    const bodyWidth = candleWidth * 0.6;

    // 기준선 (시가)
    const openY = padding.top + chartHeight * (1 - (openPrice - minPrice) / priceRange);
    ctx.strokeStyle = "#9CA3AF";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, openY);
    ctx.lineTo(width - padding.right, openY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 캔들 그리기
    candles.forEach((candle) => {
      const slotIndex = candle.hour - 9; // 09시 = 0, 10시 = 1, ...
      const centerX = padding.left + candleWidth * slotIndex + candleWidth / 2;

      const isUpCandle = candle.close >= candle.open;
      const color = isUpCandle ? "#EF4444" : "#3B82F6"; // 양봉: 빨강, 음봉: 파랑

      // 꼬리 (위아래 심지)
      const highY = padding.top + chartHeight * (1 - (candle.high - minPrice) / priceRange);
      const lowY = padding.top + chartHeight * (1 - (candle.low - minPrice) / priceRange);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, highY);
      ctx.lineTo(centerX, lowY);
      ctx.stroke();

      // 몸통
      const openY = padding.top + chartHeight * (1 - (candle.open - minPrice) / priceRange);
      const closeY = padding.top + chartHeight * (1 - (candle.close - minPrice) / priceRange);
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1);

      ctx.fillStyle = color;
      ctx.fillRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
    });

    // 시간 라벨
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";

    for (let hour = 9; hour <= 15; hour++) {
      const slotIndex = hour - 9;
      const x = padding.left + candleWidth * slotIndex + candleWidth / 2;
      ctx.fillText(`${hour}시`, x, height - 5);
    }
  }, [priceHistory, openPrice, isUp, hourCandles, isToday]);

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
            {hourCandles.length > 0 || priceHistory.length >= 2 ? (
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                {isToday ? "차트 데이터 수집 중..." : "시간봉 데이터 없음"}
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

        {/* 시가총액 & 체결강도 */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm">시가총액</span>
            <span className="font-medium">{formatMarketCap(metadata?.market_cap ?? null)}</span>
          </div>
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
