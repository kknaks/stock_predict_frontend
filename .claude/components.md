# 컴포넌트 명세

## Common 컴포넌트

### `BottomNav`
- **위치**: `components/common/BottomNav.tsx`
- **역할**: 하단 네비게이션 바
- **탭**: 예측, 잔고, 내역, 설정
- **사용처**: `(main)/layout.tsx`

### `Header`
- **위치**: `components/common/Header.tsx`
- **역할**: 페이지 상단 헤더
- **Props**: `title`, `showBack?` (뒤로가기 버튼)

### `Button`
- **위치**: `components/common/Button.tsx`
- **역할**: 공통 버튼
- **Props**: `variant`, `size`, `disabled`, `onClick`

### `Modal`
- **위치**: `components/common/Modal.tsx`
- **역할**: 모달 팝업
- **Props**: `isOpen`, `onClose`, `title`, `children`

### `Loading`
- **위치**: `components/common/Loading.tsx`
- **역할**: 로딩 스피너

### `Card`
- **위치**: `components/common/Card.tsx`
- **역할**: 카드 컨테이너
- **Props**: `children`, `onClick?`

---

## Predict 컴포넌트

### `StrategyList`
- **위치**: `components/predict/StrategyList.tsx`
- **역할**: 전략별 종목 리스트 섹션
- **Props**: `strategy`, `stocks`

### `StockCard`
- **위치**: `components/predict/StockCard.tsx`
- **역할**: 종목 카드 (리스트 아이템)
- **표시**: 종목명, 현재가, 등락률, 예측가
- **Props**: `stock`, `onClick`

### `StockChart`
- **위치**: `components/predict/StockChart.tsx`
- **역할**: 주가 차트 (캔들 또는 라인)
- **Props**: `data`, `type?`
- **라이브러리**: 추후 결정

### `OrderBook`
- **위치**: `components/predict/OrderBook.tsx`
- **역할**: 호가창
- **표시**: 매수호가, 매도호가, 잔량
- **Props**: `askOrders`, `bidOrders`

### `PredictInfo`
- **위치**: `components/predict/PredictInfo.tsx`
- **역할**: AI 예측 정보 표시
- **Props**: `predictPrice`, `confidence?`

---

## Balance 컴포넌트

### `SummaryCard`
- **위치**: `components/balance/SummaryCard.tsx`
- **역할**: 요약 정보 카드
- **표시**: 총 매입, 총 매도, 수익률
- **Props**: `totalBuy`, `totalSell`, `profitRate`

### `HoldingList`
- **위치**: `components/balance/HoldingList.tsx`
- **역할**: 보유 종목 리스트
- **Props**: `holdings`

### `HoldingItem`
- **위치**: `components/balance/HoldingItem.tsx`
- **역할**: 보유 종목 아이템
- **Props**: `holding` (종목, 수량, 평균단가, 현재가, 수익률)

### `ProfitChart`
- **위치**: `components/balance/ProfitChart.tsx`
- **역할**: 수익률 차트
- **Props**: `data`

---

## History 컴포넌트

### `Calendar`
- **위치**: `components/history/Calendar.tsx`
- **역할**: 달력 (날짜 선택)
- **Props**: `selectedDate`, `onSelect`, `markedDates`

### `BalanceGraph`
- **위치**: `components/history/BalanceGraph.tsx`
- **역할**: 잔고 누적 그래프
- **Props**: `data`

### `DailyStats`
- **위치**: `components/history/DailyStats.tsx`
- **역할**: 일별 거래 통계
- **Props**: `date`, `stats`

### `TradeList`
- **위치**: `components/history/TradeList.tsx`
- **역할**: 거래 내역 리스트
- **Props**: `trades`

### `TradeItem`
- **위치**: `components/history/TradeItem.tsx`
- **역할**: 거래 내역 아이템
- **Props**: `trade` (종목, 매수/매도, 수량, 가격, 시간)

---

## Settings 컴포넌트

### `AccountSection`
- **위치**: `components/settings/AccountSection.tsx`
- **역할**: 계좌 연동 섹션

### `TradeSettings`
- **위치**: `components/settings/TradeSettings.tsx`
- **역할**: 매매 설정 (손절/익절 비율 등)

### `ProfileSection`
- **위치**: `components/settings/ProfileSection.tsx`
- **역할**: 프로필/로그인 정보
