import { StockMetadata } from "@/types/predict";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 메모리 캐시 (세션 동안 유지)
const metadataCache: Record<string, StockMetadata> = {};

export const stockService = {
  async getMetadata(stockCode: string): Promise<StockMetadata> {
    // 캐시에 있으면 반환
    if (metadataCache[stockCode]) {
      return metadataCache[stockCode];
    }

    const response = await fetch(
      `${API_URL}/api/v1/stocks/metadata?stock_code=${stockCode}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata for ${stockCode}`);
    }

    const data: StockMetadata = await response.json();

    // 캐시에 저장
    metadataCache[stockCode] = data;

    return data;
  },
};
