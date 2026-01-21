"use client";

import { useEffect, useState } from "react";
import { balanceService } from "@/services/balance";
import { TdPositionResponse, StockPosition } from "@/types/balance";

type TabType = "all" | "holding" | "sold";

export default function BalancePage() {
  const [data, setData] = useState<TdPositionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const fetchPosition = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await balanceService.getPosition(date);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로딩 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosition();
  }, [date]);

  const formatPrice = (value: number | null) => {
    if (value === null) return "-";
    return Math.round(value).toLocaleString();
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "-";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const getProfitColor = (value: number | null) => {
    if (value === null) return "text-gray-500";
    return value >= 0 ? "text-red-500" : "text-blue-500";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "holding":
        return "보유";
      case "target_reached":
        return "익절";
      case "stop_loss":
        return "손절";
      case "sold":
        return "매도";
      case "not_purchased":
        return "실패";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "holding":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "target_reached":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "stop_loss":
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
      case "sold":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "not_purchased":
        return "bg-black text-white dark:bg-gray-950 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredPositions = (data?.positions.filter((position) => {
    if (activeTab === "all") return true;
    if (activeTab === "holding") return position.status === "holding";
    return position.status !== "holding" && position.status !== "not_purchased";
  }) || []).sort((a, b) => {
    // 실패(not_purchased)는 제일 아래로
    if (a.status === "not_purchased" && b.status !== "not_purchased") return 1;
    if (a.status !== "not_purchased" && b.status === "not_purchased") return -1;
    return 0;
  });

  const formatStockName = (name: string) => {
    if (name.length > 6) return name.slice(0, 6) + "...";
    return name;
  };

  const renderPositionItem = (position: StockPosition) => {
    const isHolding = position.status === "holding";
    const isNotPurchased = position.status === "not_purchased";
    const showCurrentPrice = isHolding || isNotPurchased;

    return (
      <div
        key={position.stock_code}
        className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
      >
        {/* 1행: 종목명 | 평가손익 | 평가금액 | 현재가 */}
        <div className="flex items-center">
          <div className="flex-[1.5] min-w-0 flex items-center gap-1">
            <span className="font-bold text-sm whitespace-nowrap">
              {formatStockName(position.stock_name)}
            </span>
            <span className={`text-[10px] px-1 py-0.5 rounded whitespace-nowrap ${getStatusColor(position.status)}`}>
              {getStatusLabel(position.status)}
            </span>
          </div>
          <div className={`flex-1 text-right font-bold ${isNotPurchased ? "text-gray-400" : getProfitColor(position.profit_amount)}`}>
            {isNotPurchased ? "-" : formatPrice(position.profit_amount)}
          </div>
          <div className="flex-1 text-right">
            {isNotPurchased ? "-" : (isHolding ? formatPrice(position.eval_amount) : formatPrice(position.sell_amount))}
          </div>
          <div className={`flex-1 text-right font-bold ${isNotPurchased ? "text-gray-500" : getProfitColor(position.profit_rate)}`}>
            {showCurrentPrice ? formatPrice(position.current_price) : formatPrice(position.sell_price)}
          </div>
        </div>

        {/* 2행: 코드 | 수익률 | 매입금액 | 매입단가 */}
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <div className="flex-[1.5] min-w-0 flex gap-2">
            <span>{position.stock_code}</span>
            {isHolding && (
              <span className="text-gray-400">
                {position.holding_quantity}주
              </span>
            )}
          </div>
          <div className={`flex-1 text-right ${getProfitColor(position.profit_rate)}`}>
            {formatPercent(position.profit_rate)}
          </div>
          <div className="flex-1 text-right">
            {formatPrice(position.buy_amount)}
          </div>
          <div className="flex-1 text-right">
            {formatPrice(position.buy_price)}
          </div>
        </div>

        {/* 3행: 목표가/손절가 정보 */}
        <div className="flex items-center mt-1 text-[10px] text-gray-400">
          <div className="flex-[1.5] min-w-0">
            목표 <span className="text-red-400">{formatPrice(position.target_price)}</span>
            {" / "}
            손절 <span className="text-blue-400">{formatPrice(position.stop_loss_price)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 pb-20">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">잔고</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      {loading && <p className="text-gray-500">로딩 중...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && data && (
        <>
          {/* 실현수익금 카드 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-4">
            <div className="text-sm text-gray-500 mb-1">실현수익금</div>
            <div className={`text-2xl font-bold ${getProfitColor(data.summary.realized_profit_amount)}`}>
              {formatPrice(data.summary.realized_profit_amount)}원
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>익절 {data.summary.total_target_reached_count}건</span>
              <span>손절 {data.summary.total_stop_loss_count}건</span>
              <span>총 {data.summary.total_sold_count}건 매도</span>
            </div>
          </div>

          {/* 요약 정보 카드 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">매입금액</div>
                <div className="text-lg font-bold">
                  {formatPrice(data.summary.holding_buy_amount)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">평가손익</div>
                <div className={`text-lg font-bold ${getProfitColor(data.summary.holding_profit_amount)}`}>
                  {formatPrice(data.summary.holding_profit_amount)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">평가금액</div>
                <div className="text-lg font-bold">
                  {formatPrice(data.summary.holding_eval_amount)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">수익률(%)</div>
                <div className={`text-lg font-bold ${getProfitColor(data.summary.holding_profit_rate)}`}>
                  {formatPercent(data.summary.holding_profit_rate)}
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              보유 {data.summary.total_holding_count}종목
            </div>
          </div>

          {/* 포지션 목록 카드 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
            {/* 탭 */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === "all"
                    ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setActiveTab("holding")}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === "holding"
                    ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                보유
              </button>
              <button
                onClick={() => setActiveTab("sold")}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === "sold"
                    ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                매도완료
              </button>
            </div>

            {/* 테이블 헤더 */}
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center">
                <div className="flex-[1.5] min-w-0">종목명</div>
                <div className="flex-1 text-right">평가손익</div>
                <div className="flex-1 text-right">평가금액</div>
                <div className="flex-1 text-right">현재가</div>
              </div>
              <div className="flex items-center mt-1">
                <div className="flex-[1.5] min-w-0">코드 보유수량</div>
                <div className="flex-1 text-right">수익률</div>
                <div className="flex-1 text-right">매입금액</div>
                <div className="flex-1 text-right">매입단가</div>
              </div>
            </div>

            {/* 포지션 목록 */}
            <div className="px-4">
              {filteredPositions.length === 0 ? (
                <p className="py-4 text-center text-gray-500 text-sm">
                  {activeTab === "holding" ? "보유 종목이 없습니다" :
                   activeTab === "sold" ? "매도 완료된 종목이 없습니다" :
                   "포지션 데이터가 없습니다"}
                </p>
              ) : (
                filteredPositions.map(renderPositionItem)
              )}
            </div>
          </div>
        </>
      )}

      {!loading && !error && !data && (
        <p className="text-gray-500">해당 날짜의 잔고 데이터가 없습니다.</p>
      )}
    </div>
  );
}
