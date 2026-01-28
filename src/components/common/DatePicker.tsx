"use client";

import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD 형식
  onChange: (date: string) => void;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // YYYY-MM-DD 문자열을 로컬 타임존 Date로 파싱
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // 날짜 파싱
  const selectedDate = parseLocalDate(value);
  const [viewDate, setViewDate] = useState(() => parseLocalDate(value));

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  // value 변경 시 viewDate 동기화
  useEffect(() => {
    setViewDate(parseLocalDate(value));
  }, [value]);

  // 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 타임존 기준)
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 날짜 포맷 (2026.1.23)
  const formatDisplayDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}.${month}.${day}`;
  };

  // 이전 날짜
  const goToPrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onChange(formatDateString(newDate));
  };

  // 다음 날짜
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onChange(formatDateString(newDate));
  };

  // 달력 열기/닫기
  const toggleCalendar = () => {
    if (!showCalendar) {
      setViewDate(parseLocalDate(value));
    }
    setShowCalendar(!showCalendar);
  };

  // 날짜 선택
  const selectDate = (date: Date) => {
    onChange(formatDateString(date));
    setShowCalendar(false);
  };

  // 이전 달
  const goToPrevMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewDate(newDate);
  };

  // 다음 달
  const goToNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewDate(newDate);
  };

  // 달력 렌더링용 데이터 생성
  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // 해당 월의 첫 날
    const firstDay = new Date(year, month, 1);
    // 해당 월의 마지막 날
    const lastDay = new Date(year, month + 1, 0);

    // 시작 요일 (0: 일요일)
    const startDayOfWeek = firstDay.getDay();
    // 해당 월의 총 일수
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];

    // 앞쪽 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 날짜 채우기
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = generateCalendarDays();
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  return (
    <div className="relative" ref={calendarRef}>
      {/* 날짜 네비게이션 */}
      <div className="flex items-center gap-1">
        <button
          onClick={goToPrevDay}
          className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="이전 날짜"
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
          onClick={toggleCalendar}
          className="px-2 py-1 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        >
          {formatDisplayDate(selectedDate)}
        </button>

        <button
          onClick={goToNextDay}
          className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="다음 날짜"
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

      {/* 달력 팝업 */}
      {showCalendar && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[280px]">
          {/* 달력 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goToPrevMonth}
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
            <span className="font-medium">
              {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
            </span>
            <button
              onClick={goToNextMonth}
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

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-1 ${
                  index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-gray-500"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <div key={index} className="aspect-square">
                {date ? (
                  <button
                    onClick={() => selectDate(date)}
                    className={`w-full h-full flex items-center justify-center text-sm rounded-full transition-colors ${
                      isSameDay(date, selectedDate)
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold"
                        : isToday(date)
                        ? "border border-gray-900 dark:border-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    } ${
                      date.getDay() === 0
                        ? "text-red-500"
                        : date.getDay() === 6
                        ? "text-blue-500"
                        : ""
                    } ${isSameDay(date, selectedDate) ? "!text-white dark:!text-gray-900" : ""}`}
                  >
                    {date.getDate()}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
