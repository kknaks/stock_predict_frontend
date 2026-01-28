"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries, HistogramSeries, ColorType } from "lightweight-charts";
import { MinuteCandle } from "@/types/predict";

interface OHLCVData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  candles: MinuteCandle[];
  targetPrice: number;
  stopLossPrice: number;
  buyPrice: number;
}

export default function StockChart({
  candles,
  targetPrice,
  stopLossPrice,
  buyPrice,
}: StockChartProps) {
  const candleContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const [selectedData, setSelectedData] = useState<OHLCVData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [volumeTooltip, setVolumeTooltip] = useState<{ time: string; volume: number; x: number; y: number } | null>(null);
  const candleMapRef = useRef<Map<number, OHLCVData>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candleChartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeChartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candleSeriesRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSeriesRef = useRef<any>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!candleContainerRef.current || !volumeContainerRef.current) return;

    // 캔들 차트
    const candleChart = createChart(candleContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "#e5e7eb20" },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderVisible: false,
        visible: false, // 캔들 차트는 시간축 숨김
      },
      crosshair: {
        vertLine: { color: "#9ca3af50", width: 1, style: 2 },
        horzLine: { color: "#9ca3af50", width: 1, style: 2 },
      },
      handleScale: { axisPressedMouseMove: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
    });

    const candleSeries = candleChart.addSeries(CandlestickSeries, {
      upColor: "#ef4444",
      downColor: "#3b82f6",
      borderUpColor: "#ef4444",
      borderDownColor: "#3b82f6",
      wickUpColor: "#ef4444",
      wickDownColor: "#3b82f6",
      priceFormat: {
        type: "price",
        precision: 0,
        minMove: 1,
      },
    });

    // 볼륨 차트
    const volumeChart = createChart(volumeContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "#e5e7eb20" },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0 },
        visible: false, // 볼륨 Y축 숨김
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "#9ca3af50", width: 1, style: 2 },
        horzLine: { color: "#9ca3af50", width: 1, style: 2 },
      },
      handleScale: { axisPressedMouseMove: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
    });

    const volumeSeries = volumeChart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
    });

    candleChartRef.current = candleChart;
    volumeChartRef.current = volumeChart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // 차트 동기화
    const syncCharts = (source: typeof candleChart, target: typeof volumeChart) => {
      source.timeScale().subscribeVisibleTimeRangeChange(() => {
        if (isSyncing.current) return;
        isSyncing.current = true;
        const range = source.timeScale().getVisibleLogicalRange();
        if (range) {
          target.timeScale().setVisibleLogicalRange(range);
        }
        isSyncing.current = false;
      });
    };

    syncCharts(candleChart, volumeChart);
    syncCharts(volumeChart, candleChart);

    // 터치/드래그 시 캔들 정보 표시
    candleChart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setSelectedData(null);
        setTooltipPos(null);
        return;
      }
      const data = candleMapRef.current.get(param.time as number);
      if (data) {
        setSelectedData(data);
        setTooltipPos({ x: param.point.x, y: param.point.y });
      }
    });

    // 볼륨 차트 터치/드래그 시 정보 표시
    volumeChart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setVolumeTooltip(null);
        return;
      }
      const data = candleMapRef.current.get(param.time as number);
      if (data) {
        setVolumeTooltip({ time: data.time, volume: data.volume, x: param.point.x, y: param.point.y });
      }
    });

    const handleResize = () => {
      if (candleContainerRef.current) {
        candleChart.applyOptions({
          width: candleContainerRef.current.clientWidth,
          height: candleContainerRef.current.clientHeight,
        });
      }
      if (volumeContainerRef.current) {
        volumeChart.applyOptions({
          width: volumeContainerRef.current.clientWidth,
          height: volumeContainerRef.current.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      candleChart.remove();
      volumeChart.remove();
    };
  }, []);

  // 데이터 업데이트
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    if (candles.length === 0) {
      candleSeriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      return;
    }

    // 한국 시간 → UTC 변환 (차트는 UTC로 표시)
    const toChartTime = (dateTime: string) => {
      const [date, time] = dateTime.split("T");
      const [year, month, day] = date.split("-").map(Number);
      const [hour, minute, second] = time.split(":").map(Number);
      return Date.UTC(year, month - 1, day, hour, minute, second || 0) / 1000;
    };

    // 캔들 맵 초기화
    candleMapRef.current.clear();

    // 캔들 데이터
    const candleData = candles.map((c) => {
      const dateTime = `${c.candle_date}T${c.candle_time}`;
      const time = toChartTime(dateTime);

      // 맵에 저장 (터치 시 조회용)
      candleMapRef.current.set(time, {
        time: c.candle_time.slice(0, 5), // HH:mm
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      });

      return {
        time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      };
    });

    // 볼륨 데이터
    const volumeData = candles.map((c) => {
      const dateTime = `${c.candle_date}T${c.candle_time}`;
      const isUp = c.close >= c.open;
      return {
        time: toChartTime(dateTime),
        value: c.volume,
        color: isUp ? "#ef444480" : "#3b82f680",
      };
    });

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    // 기존 라인 제거
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const priceLines = (candleSeriesRef.current as any).priceLines?.() || [];
    priceLines.forEach((line: unknown) => candleSeriesRef.current.removePriceLine(line));

    // 목표가 라인
    if (targetPrice > 0) {
      candleSeriesRef.current.createPriceLine({
        price: targetPrice,
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "목표",
      });
    }

    // 매입가 라인
    if (buyPrice > 0) {
      candleSeriesRef.current.createPriceLine({
        price: buyPrice,
        color: "#22c55e",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "매입",
      });
    }

    // 손절가 라인
    if (stopLossPrice > 0) {
      candleSeriesRef.current.createPriceLine({
        price: stopLossPrice,
        color: "#3b82f6",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "손절",
      });
    }

    // 전체 데이터 표시
    candleChartRef.current?.timeScale().fitContent();
    volumeChartRef.current?.timeScale().fitContent();
  }, [candles, targetPrice, stopLossPrice, buyPrice]);

  const formatNumber = (n: number) => n.toLocaleString();

  return (
    <div className="w-full h-full flex flex-col">
      {/* OHLCV 정보 표시 */}
      <div className="shrink-0 px-2 py-1 text-xs flex gap-2 flex-wrap min-h-[24px]">
        {selectedData ? (
          <>
            <span className="text-gray-500">{selectedData.time}</span>
            <span>시 <span className="text-gray-900 dark:text-white">{formatNumber(selectedData.open)}</span></span>
            <span>고 <span className="text-red-500">{formatNumber(selectedData.high)}</span></span>
            <span>저 <span className="text-blue-500">{formatNumber(selectedData.low)}</span></span>
            <span>종 <span className="text-gray-900 dark:text-white">{formatNumber(selectedData.close)}</span></span>
            <span>량 <span className="text-gray-600 dark:text-gray-400">{formatNumber(selectedData.volume)}</span></span>
          </>
        ) : (
          <span className="text-gray-400">차트를 터치하세요</span>
        )}
      </div>

      {/* 캔들 차트 영역 */}
      <div ref={candleContainerRef} className="flex-[3] min-h-0 relative">
        {/* 툴팁 */}
        {selectedData && tooltipPos && (
          <div
            className="absolute pointer-events-none z-10 bg-gray-900/90 text-white text-xs px-2 py-1.5 rounded shadow-lg whitespace-nowrap"
            style={{
              left: tooltipPos.x + 10,
              top: Math.max(10, tooltipPos.y - 80),
              transform: tooltipPos.x > 200 ? 'translateX(-100%)' : 'none',
            }}
          >
            <div className="font-medium mb-1">{selectedData.time}</div>
            <div>시 {formatNumber(selectedData.open)}</div>
            <div>고 <span className="text-red-400">{formatNumber(selectedData.high)}</span></div>
            <div>저 <span className="text-blue-400">{formatNumber(selectedData.low)}</span></div>
            <div>종 {formatNumber(selectedData.close)}</div>
            <div>거래량 {formatNumber(selectedData.volume)}</div>
          </div>
        )}
      </div>

      {/* 거래량 라벨 */}
      <div className="text-xs text-gray-500 px-2 py-1 shrink-0">거래량</div>

      {/* 거래량 차트 영역 */}
      <div ref={volumeContainerRef} className="flex-[1] min-h-0 relative">
        {/* 거래량 툴팁 */}
        {volumeTooltip && (
          <div
            className="absolute pointer-events-none z-10 bg-gray-800/80 text-white text-[10px] px-1.5 py-0.5 rounded shadow"
            style={{
              left: volumeTooltip.x + 8,
              top: Math.max(2, volumeTooltip.y - 20),
              transform: volumeTooltip.x > 200 ? 'translateX(-100%)' : 'none',
            }}
          >
            {volumeTooltip.time} {formatNumber(volumeTooltip.volume)}
          </div>
        )}
      </div>
    </div>
  );
}
