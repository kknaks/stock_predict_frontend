# 프로젝트 컨텍스트

## 개요

주식 자동매매 시스템의 프론트엔드. 백엔드 API에서 데이터를 받아 렌더링하는 역할.

## 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks (필요시 Zustand 추가)
- **HTTP Client**: Axios 또는 fetch
- **Charts**: 차트 라이브러리 (추후 결정: recharts, lightweight-charts 등)

## 디자인 원칙

1. **Mobile First**: 모바일 기기가 주요 접속 환경
2. **Simple UI**: 복잡하지 않은 단순한 UI
3. **Data Display**: 백엔드 데이터를 보여주는 것이 주 역할
4. **Performance**: 빠른 로딩, 최소한의 리렌더링

## 인증

- 로그인하지 않으면 `/login`으로 리다이렉트
- 인증 토큰은 쿠키 또는 localStorage에 저장 (추후 결정)
- `(main)` 그룹의 모든 페이지는 인증 필요

## 백엔드 시스템 구성

```
Airflow → AI Server → WebSocket Server → API Server
                              ↓
                           Redis
                              ↓
                          증권사 API
```

### 프론트엔드가 통신하는 서버

- **API Server**: 데이터 조회/저장 (REST API)
- **WebSocket Server**: 실시간 데이터 (향후 필요시)

## 네비게이션 구조

하단 고정 네비게이션 바 (4탭):
1. 예측 (`/predict`)
2. 잔고 (`/balance`)
3. 내역 (`/history`)
4. 설정 (`/settings`)
