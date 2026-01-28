"use client";

import { useState, useRef, useEffect } from "react";

interface MonthPickerProps {
  year: number;
  month: number; // 1-12
  onChange: (year: number, month: number) => void;
}

export default function MonthPicker({ year, month, onChange }: MonthPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [viewYear, setViewYear] = useState(year);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  // year 변경 시 viewYear 동기화
  useEffect(() => {
    setViewYear(year);
  }, [year]);

  // 이전 달
  const goToPrevMonth = () => {
    if (month === 1) {
      onChange(year - 1, 12);
    } else {
      onChange(year, month - 1);
    }
  };

  // 다음 달
  const goToNextMonth = () => {
    if (month === 12) {
      onChange(year + 1, 1);
    } else {
      onChange(year, month + 1);
    }
  };

  // 월 선택
  const selectMonth = (selectedMonth: number) => {
    onChange(viewYear, selectedMonth);
    setShowPicker(false);
  };

  // 팝업 열기
  const togglePicker = () => {
    if (!showPicker) {
      setViewYear(year);
    }
    setShowPicker(!showPicker);
  };

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="relative" ref={pickerRef}>
      {/* 네비게이션 */}
      <div className="flex items-center gap-1">
        <button
          onClick={goToPrevMonth}
          className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="이전 달"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={togglePicker}
          className="px-2 py-1 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        >
          {year}.{String(month).padStart(2, "0")}
        </button>

        <button
          onClick={goToNextMonth}
          className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="다음 달"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 년/월 선택 팝업 */}
      {showPicker && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[240px]">
          {/* 년도 선택 */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewYear(viewYear - 1)}
              className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-medium">{viewYear}년</span>
            <button
              onClick={() => setViewYear(viewYear + 1)}
              className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 월 그리드 */}
          <div className="grid grid-cols-4 gap-2">
            {months.map((m) => (
              <button
                key={m}
                onClick={() => selectMonth(m)}
                className={`py-2 text-sm rounded transition-colors ${
                  viewYear === year && m === month
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {m}월
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
