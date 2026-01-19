# API 명세 (예상)

> 백엔드 API 구현에 따라 수정 필요

## Base URL

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 인증 API

### POST `/auth/login`
로그인

**Request**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string"
  }
}
```

### POST `/auth/logout`
로그아웃

### GET `/auth/me`
현재 사용자 정보

---

## 예측 API

### GET `/predict/strategies`
전략 목록 조회

**Response**:
```json
{
  "strategies": [
    {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  ]
}
```

### GET `/predict/stocks?strategy={strategyId}`
전략별 예측 종목 조회

**Response**:
```json
{
  "stocks": [
    {
      "stockId": "string",
      "stockCode": "string",
      "stockName": "string",
      "currentPrice": "number",
      "predictPrice": "number",
      "changeRate": "number",
      "strategy": "string"
    }
  ]
}
```

### GET `/predict/stocks/{stockId}`
종목 상세 조회

**Response**:
```json
{
  "stock": {
    "stockId": "string",
    "stockCode": "string",
    "stockName": "string",
    "currentPrice": "number",
    "predictPrice": "number",
    "changeRate": "number"
  },
  "chart": [
    {
      "date": "string",
      "open": "number",
      "high": "number",
      "low": "number",
      "close": "number",
      "volume": "number"
    }
  ],
  "orderBook": {
    "asks": [{ "price": "number", "quantity": "number" }],
    "bids": [{ "price": "number", "quantity": "number" }]
  }
}
```

---

## 잔고 API

### GET `/balance`
현재 잔고 조회

**Response**:
```json
{
  "summary": {
    "totalBuy": "number",
    "totalSell": "number",
    "profitRate": "number",
    "totalAsset": "number"
  },
  "holdings": [
    {
      "stockCode": "string",
      "stockName": "string",
      "quantity": "number",
      "avgPrice": "number",
      "currentPrice": "number",
      "profitRate": "number",
      "profitAmount": "number"
    }
  ]
}
```

---

## 내역 API

### GET `/history/calendar?year={year}&month={month}`
달력 데이터 (거래 있는 날짜)

**Response**:
```json
{
  "tradeDates": ["2024-01-15", "2024-01-16", "2024-01-18"]
}
```

### GET `/history/graph?period={period}`
잔고 추이 그래프 데이터

**Query**: `period` = `1M`, `3M`, `6M`, `1Y`, `ALL`

**Response**:
```json
{
  "data": [
    { "date": "2024-01-01", "totalAsset": "number" },
    { "date": "2024-01-02", "totalAsset": "number" }
  ]
}
```

### GET `/history/{date}`
특정 날짜 거래 내역

**Response**:
```json
{
  "date": "2024-01-15",
  "summary": {
    "buyCount": "number",
    "sellCount": "number",
    "profitRate": "number"
  },
  "stockStats": [
    {
      "stockCode": "string",
      "stockName": "string",
      "buyCount": "number",
      "sellCount": "number",
      "profitRate": "number"
    }
  ],
  "trades": [
    {
      "id": "number",
      "stockCode": "string",
      "stockName": "string",
      "type": "BUY | SELL",
      "quantity": "number",
      "price": "number",
      "time": "string"
    }
  ]
}
```

---

## 설정 API

### GET `/settings`
설정 조회

**Response**:
```json
{
  "account": {
    "connected": "boolean",
    "accountNumber": "string",
    "broker": "string"
  },
  "tradeSettings": {
    "stopLossRate": "number",
    "takeProfitRate": "number",
    "maxBuyAmount": "number"
  }
}
```

### PUT `/settings/trade`
매매 설정 수정

**Request**:
```json
{
  "stopLossRate": "number",
  "takeProfitRate": "number",
  "maxBuyAmount": "number"
}
```

### POST `/settings/account/connect`
계좌 연동

### DELETE `/settings/account/disconnect`
계좌 연동 해제
