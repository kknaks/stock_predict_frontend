"use client";

import { useEffect, useState, useMemo } from "react";
import { historyService } from "@/services/history";
import { HistoryResponse, AccountHistoryResponse, DailyHistory } from "@/types/history";
import MonthPicker from "@/components/common/MonthPicker";

type ViewMode = "calendar" | "daily" | "cumulative";

interface TooltipData {
  day: number;
  value: number;
  label: string;
  x: number;
  y: number;
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<DailyHistory | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const dateString = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  }, [currentDate]);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await historyService.getHistory(dateString);
      setData(response);
      // 첫 번째 계좌 자동 선택
      if (response.accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(response.accounts[0].account_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로딩 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [dateString]);

  // 선택된 계좌 데이터
  const selectedAccount: AccountHistoryResponse | undefined = data?.accounts.find(
    (acc) => acc.account_id === selectedAccountId
  );

  const formatPrice = (value: number) => {
    return Math.round(value).toLocaleString();
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const getProfitColor = (value: number) => {
    return value >= 0 ? "text-red-500" : "text-blue-500";
  };

  const getProfitBgColor = (value: number, isSelected: boolean = false) => {
    if (value === 0) return isSelected ? "bg-gray-200 dark:bg-gray-700" : "";
    if (value > 0) {
      return isSelected ? "bg-red-200 dark:bg-red-800/50" : "bg-red-100 dark:bg-red-900/30";
    }
    return isSelected ? "bg-blue-200 dark:bg-blue-800/50" : "bg-blue-100 dark:bg-blue-900/30";
  };

  const handleMonthChange = (year: number, month: number) => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
    setTooltip(null);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setTooltip(null);
  };

  // 달력 데이터 생성
  const calendarData = useMemo(() => {
    if (!data || !selectedAccount) return [];

    const year = data.year;
    const month = data.month - 1;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const historyMap = new Map(
      selectedAccount.daily_histories.map((h) => [h.date, h])
    );

    const weeks: (DailyHistory | null)[][] = [];
    let currentWeek: (DailyHistory | null)[] = [];

    // 첫 주 빈칸
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const history = historyMap.get(dateStr);

      if (history) {
        currentWeek.push(history);
      } else {
        currentWeek.push({
          date: dateStr,
          profit_rate: 0,
          profit_amount: 0,
          cumulative_profit_rate: 0,
          cumulative_profit_amount: 0,
          buy_amount: 0,
          sell_amount: 0,
        });
      }

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // 마지막 주 빈칸
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [data, selectedAccount]);

  // 차트 데이터
  const chartData = useMemo(() => {
    if (!selectedAccount || selectedAccount.daily_histories.length === 0) return null;

    const histories = [...selectedAccount.daily_histories].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const profitRates = histories.map((h) => h.profit_rate);
    const profitAmounts = histories.map((h) => h.profit_amount);
    const cumulativeRates = histories.map((h) => h.cumulative_profit_rate);

    const maxProfitRate = Math.max(...profitRates, 0);
    const minProfitRate = Math.min(...profitRates, 0);
    const maxProfitAmount = Math.max(...profitAmounts, 0);
    const minProfitAmount = Math.min(...profitAmounts, 0);
    const maxCumulativeRate = Math.max(...cumulativeRates, 0);
    const minCumulativeRate = Math.min(...cumulativeRates, 0);

    return {
      histories,
      profitRates,
      profitAmounts,
      cumulativeRates,
      maxProfitRate,
      minProfitRate,
      maxProfitAmount,
      minProfitAmount,
      maxCumulativeRate,
      minCumulativeRate,
    };
  }, [selectedAccount]);

  const renderCalendar = () => {
    const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`text-center text-xs font-medium py-2 ${
                index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-gray-500"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 달력 본체 */}
        {calendarData.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {week.map((day, dayIndex) => {
              if (!day) {
                return <div key={dayIndex} className="h-16" />;
              }

              const dayNum = parseInt(day.date.split("-")[2]);
              const hasData = day.profit_rate !== 0 || day.profit_amount !== 0;
              const isSelected = selectedDay?.date === day.date;
              const isSunday = dayIndex === 0;
              const isSaturday = dayIndex === 6;

              return (
                <div
                  key={dayIndex}
                  onClick={() => hasData && setSelectedDay(day)}
                  className={`h-16 p-1 border border-gray-100 dark:border-gray-800 ${
                    hasData ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : ""
                  } ${getProfitBgColor(day.profit_rate, isSelected)}`}
                >
                  <div
                    className={`text-xs ${
                      isSunday ? "text-red-500" : isSaturday ? "text-blue-500" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {dayNum}
                  </div>
                  {hasData && (
                    <div className={`text-[10px] font-bold mt-1 ${getProfitColor(day.profit_rate)}`}>
                      {formatPercent(day.profit_rate)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* 선택된 날짜 상세 */}
        {selectedDay && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium mb-2">{selectedDay.date}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">일별 수익률</span>
                <span className={`ml-2 font-bold ${getProfitColor(selectedDay.profit_rate)}`}>
                  {formatPercent(selectedDay.profit_rate)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">일별 수익금</span>
                <span className={`ml-2 font-bold ${getProfitColor(selectedDay.profit_amount)}`}>
                  {formatPrice(selectedDay.profit_amount)}원
                </span>
              </div>
              <div>
                <span className="text-gray-500">누적 수익률</span>
                <span className={`ml-2 font-bold ${getProfitColor(selectedDay.cumulative_profit_rate)}`}>
                  {formatPercent(selectedDay.cumulative_profit_rate)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">매수금액</span>
                <span className="ml-2">{formatPrice(selectedDay.buy_amount)}원</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Y축 범위 계산 (한 단계 위로 올림)
  const calcYAxisRange = (maxVal: number, minVal: number, steps: number[]) => {
    const absMax = Math.max(Math.abs(maxVal), Math.abs(minVal));
    for (const step of steps) {
      if (absMax <= step) {
        return step;
      }
    }
    // steps 범위를 넘으면 마지막 step 기준으로 올림
    const lastStep = steps[steps.length - 1];
    return Math.ceil(absMax / lastStep) * lastStep;
  };

  const renderBarChart = (
    historyMap: Map<number, number>,
    daysInMonth: number,
    maxVal: number,
    minVal: number,
    title: string,
    formatFn: (v: number) => string,
    yAxisSteps: number[],
    chartId: string
  ) => {
    const yAxisMax = calcYAxisRange(maxVal, minVal, yAxisSteps);
    const chartHeight = 180;
    const halfHeight = chartHeight / 2;

    const handleBarClick = (e: React.MouseEvent, day: number, value: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        day,
        value,
        label: formatFn(value),
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    };

    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 relative">
        <div className="text-sm font-medium mb-4">{title}</div>
        <div className="flex">
          {/* Y축 */}
          <div className="flex flex-col justify-between text-[10px] text-gray-400 pr-2 w-14 text-right" style={{ height: chartHeight }}>
            <span>{formatFn(yAxisMax)}</span>
            <span>{formatFn(0)}</span>
            <span>{formatFn(-yAxisMax)}</span>
          </div>
          {/* 차트 영역 */}
          <div className="flex-1 relative" style={{ height: chartHeight }}>
            {/* 0선 */}
            <div
              className="absolute w-full border-t border-gray-300 dark:border-gray-600"
              style={{ top: halfHeight }}
            />
            {/* 막대들 */}
            <div className="flex h-full">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const value = historyMap.get(day);
                const hasData = value !== undefined && value !== 0;
                const barHeight = hasData ? (Math.abs(value) / yAxisMax) * halfHeight : 0;
                const isPositive = (value ?? 0) >= 0;
                const isSelected = tooltip?.day === day && tooltip?.label === formatFn(value ?? 0);

                return (
                  <div
                    key={day}
                    className="flex-1 relative"
                  >
                    {hasData && (
                      <div
                        onClick={(e) => handleBarClick(e, day, value!)}
                        className={`absolute left-1/2 -translate-x-1/2 w-[6px] cursor-pointer transition-all ${
                          isPositive ? "bg-red-400 hover:bg-red-500" : "bg-blue-400 hover:bg-blue-500"
                        }`}
                        style={{
                          height: barHeight,
                          top: isPositive ? halfHeight - barHeight : halfHeight,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* X축 레이블 */}
        <div className="flex ml-14">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
            <div key={day} className="flex-1 text-center text-[8px] text-gray-400">
              {day % 5 === 1 ? day : ""}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDailyChart = () => {
    if (!chartData || !data) return <p className="text-gray-500">데이터가 없습니다.</p>;

    const daysInMonth = new Date(data.year, data.month, 0).getDate();

    // 일별 수익률 맵 (날짜 -> 값)
    const profitRateMap = new Map<number, number>();
    const profitAmountMap = new Map<number, number>();
    chartData.histories.forEach((h) => {
      const day = parseInt(h.date.split("-")[2]);
      profitRateMap.set(day, h.profit_rate);
      profitAmountMap.set(day, h.profit_amount);
    });

    // 수익률 단위: 1%, 2%, 5%, 10%, 20%, 50%, 100%
    const rateSteps = [1, 2, 5, 10, 20, 50, 100];
    // 수익금 단위: 10만, 20만, 50만, 100만, 200만, 500만, 1000만
    const amountSteps = [100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000];

    return (
      <div className="space-y-4">
        {renderBarChart(
          profitRateMap,
          daysInMonth,
          chartData.maxProfitRate,
          chartData.minProfitRate,
          "일별 수익률 (%)",
          (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`,
          rateSteps,
          "daily-rate"
        )}
        {renderBarChart(
          profitAmountMap,
          daysInMonth,
          chartData.maxProfitAmount,
          chartData.minProfitAmount,
          "일별 수익금",
          (v) => `${v >= 0 ? "+" : ""}${Math.round(v).toLocaleString()}원`,
          amountSteps,
          "daily-amount"
        )}
      </div>
    );
  };

  const renderCumulativeChart = () => {
    if (!chartData || !data) return <p className="text-gray-500">데이터가 없습니다.</p>;

    const daysInMonth = new Date(data.year, data.month, 0).getDate();

    // 누적 수익률/수익금 맵
    const cumulativeRateMap = new Map<number, number>();
    const cumulativeAmountMap = new Map<number, number>();

    chartData.histories.forEach((h) => {
      const day = parseInt(h.date.split("-")[2]);
      cumulativeRateMap.set(day, h.cumulative_profit_rate);
      cumulativeAmountMap.set(day, h.cumulative_profit_amount);
    });

    // 누적 수익금 최대/최소 계산
    const cumulativeAmounts = chartData.histories.map((h) => h.cumulative_profit_amount);
    const maxCumulativeAmount = Math.max(...cumulativeAmounts, 0);
    const minCumulativeAmount = Math.min(...cumulativeAmounts, 0);

    // 수익률 단위: 1%, 2%, 5%, 10%, 20%, 50%, 100%
    const rateSteps = [1, 2, 5, 10, 20, 50, 100];
    // 수익금 단위: 10만, 20만, 50만, 100만, 200만, 500만, 1000만
    const amountSteps = [100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000];

    return (
      <div className="space-y-4">
        {renderBarChart(
          cumulativeRateMap,
          daysInMonth,
          chartData.maxCumulativeRate,
          chartData.minCumulativeRate,
          "누적 수익률 (%)",
          (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`,
          rateSteps,
          "cumulative-rate"
        )}
        {renderBarChart(
          cumulativeAmountMap,
          daysInMonth,
          maxCumulativeAmount,
          minCumulativeAmount,
          "누적 수익금",
          (v) => `${v >= 0 ? "+" : ""}${Math.round(v).toLocaleString()}원`,
          amountSteps,
          "cumulative-amount"
        )}
      </div>
    );
  };

  return (
    <div className="p-4 pb-20">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">내역</h1>
        <MonthPicker
          year={currentDate.getFullYear()}
          month={currentDate.getMonth() + 1}
          onChange={handleMonthChange}
        />
      </div>

      {loading && <p className="text-gray-500">로딩 중...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && data && data.accounts.length > 0 && selectedAccount && (
        <>
          {/* 계좌 탭 + 월간 요약 카드 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-4">
            {/* 계좌 탭 */}
            <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-4">
              {data.accounts.map((account) => (
                <button
                  key={account.account_id}
                  onClick={() => setSelectedAccountId(account.account_id)}
                  className={`pb-3 px-4 text-base font-semibold transition-colors border-b-2 -mb-px ${
                    selectedAccountId === account.account_id
                      ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                      : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                >
                  {account.account_name}
                </button>
              ))}
            </div>

            {/* 월간 수익 */}
            <div className="text-sm text-gray-500 mb-1">월간 수익</div>
            <div className="flex items-baseline gap-3">
              <span className={`text-2xl font-bold ${getProfitColor(selectedAccount.total_profit_amount)}`}>
                {formatPrice(selectedAccount.total_profit_amount)}원
              </span>
              <span className={`text-lg font-medium ${getProfitColor(selectedAccount.total_profit_rate)}`}>
                {formatPercent(selectedAccount.total_profit_rate)}
              </span>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>거래일 {selectedAccount.trading_days}일</span>
              <span>매수 {formatPrice(selectedAccount.total_buy_amount)}원</span>
              <span>매도 {formatPrice(selectedAccount.total_sell_amount)}원</span>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              onClick={() => handleViewModeChange("calendar")}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                viewMode === "calendar"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              달력
            </button>
            <button
              onClick={() => handleViewModeChange("daily")}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                viewMode === "daily"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              일별
            </button>
            <button
              onClick={() => handleViewModeChange("cumulative")}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                viewMode === "cumulative"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              누적
            </button>
          </div>

          {/* 컨텐츠 */}
          {viewMode === "calendar" && renderCalendar()}
          {viewMode === "daily" && renderDailyChart()}
          {viewMode === "cumulative" && renderCumulativeChart()}
        </>
      )}

      {!loading && !error && (!data || data.accounts.length === 0) && (
        <p className="text-gray-500">해당 월의 데이터가 없습니다.</p>
      )}

      {/* 툴팁 */}
      {tooltip && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setTooltip(null)}
          />
          <div
            className="fixed z-50 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg -translate-x-1/2 -translate-y-full whitespace-nowrap"
            style={{
              left: tooltip.x,
              top: tooltip.y - 8,
            }}
          >
            <div className="font-medium">{data?.month}월 {tooltip.day}일</div>
            <div className={tooltip.value >= 0 ? "text-red-300" : "text-blue-300"}>
              {tooltip.label}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
