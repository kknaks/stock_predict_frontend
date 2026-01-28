import { PriceUpdate, HourCandleResponse, MinuteCandleResponse, AskingPriceUpdate } from "@/types/predict";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 가격 조회 서비스
export const priceService = {
  // 오늘 시간봉 조회 (캐시 우선)
  async getTodayCandles(stockCode: string): Promise<HourCandleResponse> {
    const response = await fetch(`${API_URL}/api/v1/price/candles/${stockCode}/hours/today`);
    if (!response.ok) throw new Error("Failed to fetch today candles");
    return response.json();
  },

  // 특정 날짜 시간봉 조회 (DB)
  async getCandlesByDate(stockCode: string, date: string): Promise<HourCandleResponse> {
    const response = await fetch(
      `${API_URL}/api/v1/price/candles/${stockCode}/hours?start_date=${date}&end_date=${date}`
    );
    if (!response.ok) throw new Error("Failed to fetch candles by date");
    const data = await response.json();
    // 응답 형식 통일
    return {
      stock_code: data.stock_code,
      date: date,
      source: "database",
      count: data.count,
      candles: data.candles,
    };
  },

  // 오늘 분봉 조회 (캐시 우선)
  async getTodayMinuteCandles(
    stockCode: string,
    minuteInterval: number = 1
  ): Promise<MinuteCandleResponse> {
    const response = await fetch(
      `${API_URL}/api/v1/price/candles/${stockCode}/minutes/today?minute_interval=${minuteInterval}`
    );
    if (!response.ok) throw new Error("Failed to fetch today minute candles");
    return response.json();
  },

  // 특정 날짜 분봉 조회 (DB)
  async getMinuteCandlesByDate(
    stockCode: string,
    date: string,
    minuteInterval: number = 1
  ): Promise<MinuteCandleResponse> {
    const response = await fetch(
      `${API_URL}/api/v1/price/candles/${stockCode}/minutes?start_date=${date}&end_date=${date}&minute_interval=${minuteInterval}`
    );
    if (!response.ok) throw new Error("Failed to fetch minute candles by date");
    const data = await response.json();
    return {
      stock_code: data.stock_code,
      date: date,
      source: "database",
      count: data.count,
      candles: data.candles,
      open_price: data.open_price,
      close_price: data.close_price,
    };
  },

  // 분봉 조회 (오늘인지 자동 판단)
  async getMinuteCandles(
    stockCode: string,
    date: string,
    minuteInterval: number = 1
  ): Promise<MinuteCandleResponse> {
    const today = new Date().toISOString().split("T")[0];
    if (date === today) {
      return this.getTodayMinuteCandles(stockCode, minuteInterval);
    }
    return this.getMinuteCandlesByDate(stockCode, date, minuteInterval);
  },

  // 장 상태 조회
  async getMarketStatus(): Promise<{ is_open: boolean }> {
    const response = await fetch(`${API_URL}/api/v1/price/market/status`);
    if (!response.ok) throw new Error("Failed to fetch market status");
    return response.json();
  },

  // 매도용 가격 조회
  async getSellPrice(stockCode: string, date: string): Promise<{
    stock_code: string;
    open_price: number;
    current_price: number;
    is_market_open: boolean;
  }> {
    const response = await fetch(`${API_URL}/api/v1/price/sell/${stockCode}?date=${date}`);
    if (!response.ok) throw new Error("Failed to fetch sell price");
    return response.json();
  },
};

export type PriceUpdateCallback = (update: PriceUpdate) => void;

export class PriceSSEService {
  private eventSource: EventSource | null = null;
  private onPriceUpdate: PriceUpdateCallback | null = null;

  connect(stockCodes: string[], onPriceUpdate: PriceUpdateCallback): void {
    if (stockCodes.length === 0) return;

    this.disconnect();
    this.onPriceUpdate = onPriceUpdate;

    const codesParam = stockCodes.join(",");
    const url = `${API_URL}/api/v1/price/stream?stock_codes=${codesParam}`;

    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener("price_update", (event) => {
      try {
        const data: PriceUpdate = JSON.parse(event.data);
        this.onPriceUpdate?.(data);
      } catch (e) {
        console.error("Failed to parse price update:", e);
      }
    });

    this.eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.onPriceUpdate = null;
  }
}

export const priceSSEService = new PriceSSEService();

// 호가 SSE 서비스
export type AskingPriceUpdateCallback = (update: AskingPriceUpdate) => void;

export class AskingPriceSSEService {
  private eventSource: EventSource | null = null;
  private onAskingPriceUpdate: AskingPriceUpdateCallback | null = null;

  connect(stockCodes: string[], onAskingPriceUpdate: AskingPriceUpdateCallback): void {
    if (stockCodes.length === 0) return;

    this.disconnect();
    this.onAskingPriceUpdate = onAskingPriceUpdate;

    const codesParam = stockCodes.join(",");
    const url = `${API_URL}/api/v1/price/asking-price/stream?stock_codes=${codesParam}`;

    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener("asking_price_update", (event) => {
      try {
        const data: AskingPriceUpdate = JSON.parse(event.data);
        this.onAskingPriceUpdate?.(data);
      } catch (e) {
        console.error("Failed to parse asking price update:", e);
      }
    });

    this.eventSource.onerror = (error) => {
      console.error("Asking price SSE connection error:", error);
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.onAskingPriceUpdate = null;
  }
}

export const askingPriceSSEService = new AskingPriceSSEService();
