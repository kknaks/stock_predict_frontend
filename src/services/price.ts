import { PriceUpdate } from "@/types/predict";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        const rawData = JSON.parse(event.data);
        const data: PriceUpdate = {
          ...rawData,
          current_price: Number(rawData.current_price),
        };
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
