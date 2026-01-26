"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  ColorType,
} from "lightweight-charts";
import { MinuteCandle } from "@/types/predict";

interface CandleChartProps {
  candles: MinuteCandle[];
  targetPrice: number;
  stopLossPrice: number;
  currentPrice: number | null;
}

export default function CandleChart({
  candles,
  targetPrice,
  stopLossPrice,
  currentPrice,
}: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // 차트 초기화
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#999",
      },
      grid: {
        vertLines: { color: "#2B2B43" },
        horzLines: { color: "#2B2B43" },
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 300,
      rightPriceScale: {
        borderColor: "#2B2B43",
      },
      timeScale: {
        borderColor: "#2B2B43",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
      autoSize: true,
    });

    const series = chart.addCandlestickSeries({
      upColor: "#ef4444",
      downColor: "#3b82f6",
      borderUpColor: "#ef4444",
      borderDownColor: "#3b82f6",
      wickUpColor: "#ef4444",
      wickDownColor: "#3b82f6",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // 데이터 업데이트
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    const candleData: CandlestickData<Time>[] = candles.map((c) => ({
      time: (new Date(c.candle_datetime).getTime() / 1000) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    seriesRef.current.setData(candleData);

    // 목표가 라인
    if (targetPrice > 0) {
      seriesRef.current.createPriceLine({
        price: targetPrice,
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "목표",
      });
    }

    // 손절가 라인
    if (stopLossPrice > 0) {
      seriesRef.current.createPriceLine({
        price: stopLossPrice,
        color: "#3b82f6",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "손절",
      });
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles, targetPrice, stopLossPrice]);

  // 현재가 실시간 업데이트
  useEffect(() => {
    if (!seriesRef.current || !currentPrice || candles.length === 0) return;

    const lastCandle = candles[candles.length - 1];
    const lastTime = (new Date(lastCandle.candle_datetime).getTime() / 1000) as Time;

    seriesRef.current.update({
      time: lastTime,
      open: lastCandle.open,
      high: Math.max(lastCandle.high, currentPrice),
      low: Math.min(lastCandle.low, currentPrice),
      close: currentPrice,
    });
  }, [currentPrice, candles]);

  return <div ref={containerRef} className="w-full h-full" />;
}
