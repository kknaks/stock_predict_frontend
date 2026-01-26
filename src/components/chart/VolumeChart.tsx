"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  HistogramData,
  Time,
  ColorType,
  HistogramSeries,
} from "lightweight-charts";
import { MinuteCandle } from "@/types/predict";

interface VolumeChartProps {
  candles: MinuteCandle[];
}

export default function VolumeChart({ candles }: VolumeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);

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
      height: containerRef.current.clientHeight || 100,
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

    const series = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
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

    const volumeData: HistogramData<Time>[] = candles.map((c) => ({
      time: (new Date(c.candle_datetime).getTime() / 1000) as Time,
      value: c.volume,
      color: c.close >= c.open ? "#ef4444" : "#3b82f6",
    }));

    seriesRef.current.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} className="w-full h-full" />;
}
