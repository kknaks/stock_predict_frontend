"use client";

import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { priceService, askingPriceSSEService } from "@/services/price";
import { orderService } from "@/services/order";
import { AskingPriceUpdate } from "@/types/predict";

type OrderType = "MARKET" | "LIMIT";

export default function SellPage({
  params,
}: {
  params: Promise<{ stockCode: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { stockCode } = use(params);

  const stockName = searchParams.get("name") || "";
  const holdingQty = Number(searchParams.get("qty") || 0);
  const avgPrice = Number(searchParams.get("avgPrice") || 0);
  const targetPrice = Number(searchParams.get("target") || 0);
  const stopLossPrice = Number(searchParams.get("stopLoss") || 0);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const dailyStrategyId = Number(searchParams.get("dailyStrategyId") || 0);

  const [orderType, setOrderType] = useState<OrderType>("LIMIT");
  const [quantity, setQuantity] = useState(holdingQty);
  const [price, setPrice] = useState(avgPrice);

  // 시세 정보
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [openPrice, setOpenPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangeRate, setPriceChangeRate] = useState<number>(0);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // 호가 정보
  const [askingPrice, setAskingPrice] = useState<AskingPriceUpdate | null>(null);

  // 주문 상태
  const [submitting, setSubmitting] = useState(false);

  // 시가 정보 & 장 개장 여부 API 요청
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const response = await priceService.getSellPrice(stockCode, date);
        setCurrentPrice(response.current_price);
        setOpenPrice(response.open_price);
        setIsMarketOpen(response.is_market_open);

        // 등락 계산
        const change = response.current_price - response.open_price;
        const changeRate = response.open_price > 0
          ? ((response.current_price - response.open_price) / response.open_price) * 100
          : 0;
        setPriceChange(change);
        setPriceChangeRate(changeRate);
      } catch (error) {
        console.error("Failed to fetch price data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [stockCode, date]);

  // 장중일 때 호가 SSE 연결
  useEffect(() => {
    if (!isMarketOpen) return;

    askingPriceSSEService.connect([stockCode], (update) => {
      if (update.stock_code === stockCode) {
        setAskingPrice(update);
      }
    });

    return () => {
      askingPriceSSEService.disconnect();
    };
  }, [stockCode, isMarketOpen]);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(0, prev + delta));
  };

  // 호가 단위 계산 (한국 주식)
  const getTickSize = (price: number): number => {
    if (price < 2000) return 1;
    if (price < 5000) return 5;
    if (price < 20000) return 10;
    if (price < 50000) return 50;
    if (price < 200000) return 100;
    if (price < 500000) return 500;
    return 1000;
  };

  const handlePriceChange = (direction: 1 | -1) => {
    setPrice((prev) => {
      const tickSize = getTickSize(prev);
      const newPrice = prev + tickSize * direction;
      return Math.max(tickSize, newPrice);
    });
  };

  const formatPrice = (value: number | null) => {
    if (value === null || value === 0) return "-";
    return value.toLocaleString();
  };

  const handleSellOrder = async () => {
    if (quantity <= 0) {
      alert("수량을 입력해주세요.");
      return;
    }
    if (orderType === "LIMIT" && price <= 0) {
      alert("단가를 입력해주세요.");
      return;
    }
    if (!dailyStrategyId) {
      alert("전략 정보가 없습니다.");
      return;
    }

    const confirmed = confirm(
      `${stockName} ${quantity}주를 ${orderType === "MARKET" ? "시장가" : `${price.toLocaleString()}원`}에 매도하시겠습니까?`
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await orderService.sell({
        daily_strategy_id: dailyStrategyId,
        stock_code: stockCode,
        order_type: orderType,
        order_price: orderType === "MARKET" ? 0 : price,
        order_quantity: quantity,
      });
      alert("매도 주문이 전송되었습니다.");
      router.back();
    } catch (error) {
      alert(error instanceof Error ? error.message : "매도 주문 실패");
    } finally {
      setSubmitting(false);
    }
  };

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
        <h1 className="text-xl font-bold">매도</h1>
      </div>

      {/* 종목 요약 */}
      <div className="shrink-0 pb-4 border-b border-gray-200 dark:border-gray-800">
        {/* 종목 정보 */}
        <div className="mb-1">
          <h2 className="text-lg font-bold">{stockName}</h2>
          <p className="text-xs text-gray-500">{stockCode}</p>
        </div>

        {/* 가격 정보 */}
        <div className="flex items-baseline justify-between">
          <span className={`text-lg font-bold ${priceChange >= 0 ? "text-red-500" : "text-blue-500"}`}>
            {currentPrice ? currentPrice.toLocaleString() : "-"}원
          </span>
          <span className={`text-base font-medium ${priceChange >= 0 ? "text-red-500" : "text-blue-500"}`}>
            {priceChange >= 0 ? "▲" : "▼"} {Math.abs(priceChange).toLocaleString() || "-"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>시가 {openPrice ? openPrice.toLocaleString() : "-"}</span>
          <span className={priceChangeRate >= 0 ? "text-red-500" : "text-blue-500"}>
            {priceChangeRate >= 0 ? "+" : ""}{priceChangeRate.toFixed(2)}%
          </span>
        </div>

        {/* 목표가/손절가 */}
        <div className="flex gap-2 mt-3 text-xs">
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

      {/* 호가 | 주문생성 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 호가 */}
        <div className="flex-1 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>호가</span>
            <span>잔량</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-sm text-gray-400">로딩중...</span>
            </div>
          ) : !isMarketOpen ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-sm text-gray-400">장중이 아닙니다</span>
            </div>
          ) : !askingPrice ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-sm text-gray-400">호가 로딩중...</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto text-xs">
              {/* 매도호가 (10 -> 1 순서로 표시, 가격 높은 순) */}
              <div>
                {[5, 4, 3, 2, 1].map((i) => {
                  const priceKey = `askp${i}` as keyof AskingPriceUpdate;
                  const qtyKey = `askp_rsqn${i}` as keyof AskingPriceUpdate;
                  const askPrice = Number(askingPrice[priceKey]);
                  const askQty = Number(askingPrice[qtyKey]);
                  return (
                    <button
                      key={`ask-${i}`}
                      onClick={() => askPrice > 0 && setPrice(askPrice)}
                      className="w-full flex items-center justify-between py-2 px-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border-b border-blue-100 dark:border-blue-900/30 last:border-b-0"
                    >
                      <span className="text-blue-600 dark:text-blue-400">
                        {askPrice > 0 ? askPrice.toLocaleString() : "-"}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {askQty > 0 ? askQty.toLocaleString() : "-"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 매수호가 (1 -> 10 순서로 표시, 가격 높은 순) */}
              <div className="mt-1">
                {[1, 2, 3, 4, 5].map((i) => {
                  const priceKey = `bidp${i}` as keyof AskingPriceUpdate;
                  const qtyKey = `bidp_rsqn${i}` as keyof AskingPriceUpdate;
                  const bidPrice = Number(askingPrice[priceKey]);
                  const bidQty = Number(askingPrice[qtyKey]);
                  return (
                    <button
                      key={`bid-${i}`}
                      onClick={() => bidPrice > 0 && setPrice(bidPrice)}
                      className="w-full flex items-center justify-between py-2 px-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border-b border-red-100 dark:border-red-900/30 last:border-b-0"
                    >
                      <span className="text-red-600 dark:text-red-400">
                        {bidPrice > 0 ? bidPrice.toLocaleString() : "-"}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {bidQty > 0 ? bidQty.toLocaleString() : "-"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 주문 생성 */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="text-sm font-medium mb-2">주문 생성</div>

          {/* 보유주식 섹션 */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">보유주식</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">보유</span>
              <span>{formatPrice(holdingQty)}주</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-gray-500">평단가</span>
              <span>{formatPrice(avgPrice)}원</span>
            </div>
          </div>

          {/* 주문정보 섹션 */}
          <div className="flex-1">
            <div className="text-sm font-medium mb-2">주문정보</div>

            {/* 주문 유형 */}
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderType)}
              className="w-full p-3 bg-gray-100 dark:bg-gray-800 text-sm focus:outline-none"
            >
              <option value="LIMIT">지정가</option>
              <option value="MARKET">시장가</option>
            </select>

            {/* 수량 입력 */}
            <div className="flex items-center mt-2 border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="w-10 h-10 shrink-0 flex items-center justify-center text-lg border-r border-gray-200 dark:border-gray-700"
              >
                −
              </button>
              <div className="flex-1 flex items-center px-3 min-w-0">
                <span className="text-gray-500 text-xs whitespace-nowrap w-8">수량</span>
                <span className="text-xs font-medium whitespace-nowrap ml-auto">{quantity.toLocaleString()}주</span>
              </div>
              <button
                onClick={() => handleQuantityChange(1)}
                className="w-10 h-10 shrink-0 flex items-center justify-center text-lg border-l border-gray-200 dark:border-gray-700"
              >
                +
              </button>
            </div>

            {/* 단가 입력 */}
            <div className={`flex items-center mt-2 border border-gray-200 dark:border-gray-700 overflow-hidden ${orderType === "MARKET" ? "opacity-40" : ""}`}>
              <button
                onClick={() => handlePriceChange(-1)}
                disabled={orderType === "MARKET"}
                className="w-10 h-10 shrink-0 flex items-center justify-center text-lg border-r border-gray-200 dark:border-gray-700 disabled:cursor-not-allowed"
              >
                −
              </button>
              <div className="flex-1 flex items-center px-3 min-w-0">
                <span className="text-gray-500 text-xs whitespace-nowrap w-8">단가</span>
                <span className="text-xs font-medium whitespace-nowrap ml-auto">{orderType === "MARKET" ? "시장가" : `${price.toLocaleString()}원`}</span>
              </div>
              <button
                onClick={() => handlePriceChange(1)}
                disabled={orderType === "MARKET"}
                className="w-10 h-10 shrink-0 flex items-center justify-center text-lg border-l border-gray-200 dark:border-gray-700 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            {/* 가능 버튼 */}
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setQuantity(holdingQty)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm"
              >
                가능
              </button>
              <span className="text-sm text-gray-500">{holdingQty.toLocaleString()}주</span>
            </div>
          </div>

          {/* 주문금액 & 매도 버튼 */}
          <div className="mt-auto pt-4">
            <div className="text-right mb-3">
              <span className="text-xs text-gray-500">주문금액</span>
              <div className="text-lg font-bold">
                {orderType === "MARKET" ? "-" : (quantity * price).toLocaleString()}원
              </div>
            </div>

            <button
              onClick={handleSellOrder}
              disabled={submitting || quantity <= 0}
              className="w-full p-3 bg-blue-500 text-white text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? "주문 전송중..." : "매도"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
