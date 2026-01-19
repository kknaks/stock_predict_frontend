# Stock Predict Frontend

주식 자동매매 프로그램 프론트엔드

## 프로젝트 개요

- **목적**: 주식 가격 자동매매 시스템의 사용자 인터페이스
- **주요 접속 기기**: 모바일 (Mobile First)
- **역할**: 백엔드 API 데이터 렌더링
- **기술 스택**: Next.js + TypeScript + Tailwind CSS

## 시스템 아키텍처

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Airflow   │────▶│  AI Server  │────▶│  WebSocket  │
│ (종목 추출)  │     │ (가격 예측)  │     │   Server    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
             ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
             │ API Server  │           │    Redis    │           │   증권사    │
             │ (데이터 저장) │           │ (매매 목록)  │           │  (주문 전송) │
             └──────┬──────┘           └─────────────┘           └─────────────┘
                    │
                    ▼
             ┌─────────────┐
             │  Frontend   │
             │  (본 프로젝트) │
             └─────────────┘
```

## 데이터 흐름

1. **Airflow** - 주식 종목 추출
2. **AI Server** - 가격 예측
3. **WebSocket Server** - 실시간 가격 확인 및 유저별 설정값 기반 매매 목록 작성
   - API Server로 매매 목록 전송 (데이터 저장)
   - Redis에 매매 목록 저장
4. **WebSocket Server** - 실시간 가격 수집 → 매도/매수 시그널 → 증권사 주문
5. **거래 발생 시** - API Server로 거래 데이터 전송

## 페이지 구성

### 하단 네비게이션 (4탭)

| 탭 | 경로 | 기능 |
|----|------|------|
| 예측 | `/predict` | 전략별 예측 종목 리스트 |
| 잔고 | `/balance` | 당일 매입/매도, 수익률 분석 |
| 내역 | `/history` | 달력 기반 과거 매매일지, 잔고 그래프 |
| 설정 | `/settings` | 계좌 연동, 로그인 설정 |

### 상세 페이지

| 경로 | 기능 |
|------|------|
| `/login` | 로그인 (미인증 시 리다이렉트) |
| `/predict/[stockId]` | 종목 상세 (차트, 호가창) |
| `/history/[date]` | 해당일 종목별 통계 |

## 디렉토리 구조

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/login/
│   └── (main)/
│       ├── layout.tsx          # 하단 네비 포함
│       ├── predict/
│       │   ├── page.tsx
│       │   └── [stockId]/page.tsx
│       ├── balance/page.tsx
│       ├── history/
│       │   ├── page.tsx
│       │   └── [date]/page.tsx
│       └── settings/page.tsx
│
├── components/
│   ├── common/                 # BottomNav, Header, Button, Modal
│   ├── predict/                # StrategyList, StockCard, StockChart, OrderBook
│   ├── balance/                # SummaryCard, ProfitChart
│   └── history/                # Calendar, DailyStats, BalanceGraph
│
├── hooks/                      # useAuth, usePredict, useBalance, useHistory
├── services/                   # API 호출 (api, auth, predict, balance, history)
├── types/                      # TypeScript 타입 정의
├── utils/                      # 유틸리티 함수
└── styles/                     # 글로벌 스타일
```

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 환경 변수

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 향후 계획

- [ ] PWA 지원
- [ ] 푸시 알림 (Capacitor 또는 외부 서비스)
