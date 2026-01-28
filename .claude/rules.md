# 코딩 규칙 및 가이드라인

## 파일/폴더 네이밍

- **컴포넌트**: PascalCase (`StockCard.tsx`)
- **페이지**: `page.tsx` (Next.js App Router 규칙)
- **훅**: camelCase with `use` prefix (`useAuth.ts`)
- **유틸리티**: camelCase (`format.ts`)
- **타입 파일**: camelCase (`stock.ts`)

## 컴포넌트 구조

```tsx
// 1. imports
import { useState } from 'react';
import { SomeType } from '@/types/some';

// 2. types/interfaces
interface Props {
  title: string;
  onClick?: () => void;
}

// 3. component
export default function ComponentName({ title, onClick }: Props) {
  // hooks
  const [state, setState] = useState();

  // handlers
  const handleClick = () => {};

  // render
  return (
    <div>
      {title}
    </div>
  );
}
```

## Import 경로

```tsx
// 절대 경로 사용 (@/ alias)
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { Stock } from '@/types/stock';
```

## 스타일링

- **Tailwind CSS** 사용
- 인라인 스타일 지양
- 복잡한 스타일은 컴포넌트로 분리

```tsx
// Good
<button className="px-4 py-2 bg-blue-500 text-white rounded">

// Avoid
<button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>
```

## 상태 관리

1. **로컬 상태**: `useState`
2. **서버 데이터**: `useSWR` 또는 `React Query` (추후 결정)
3. **전역 상태**: Zustand (필요시)

## API 호출

```tsx
// services/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// services/predict.ts
export const predictApi = {
  getStrategies: () => api.get('/predict/strategies'),
  getStocks: (strategyId: string) => api.get(`/predict/stocks?strategy=${strategyId}`),
};
```

## 에러 처리

```tsx
try {
  const data = await api.get('/endpoint');
} catch (error) {
  // 에러 처리
  console.error(error);
  // 사용자에게 알림
}
```

## TypeScript

- `any` 타입 사용 지양
- 인터페이스는 `types/` 폴더에 정의
- Props는 컴포넌트 파일 내에 정의 가능

## 모바일 우선

```tsx
// 모바일 기준 스타일 작성 후 데스크톱 확장
<div className="p-4 md:p-8">
  <h1 className="text-lg md:text-xl">
```

## PWA (Progressive Web App)

이 프로젝트는 PWA로 배포 예정. 다음 사항 고려:

- **next-pwa** 또는 **@ducanh2912/next-pwa** 패키지 사용
- `manifest.json` 설정 필요
- 오프라인 지원 고려 (서비스 워커)
- 홈 화면 추가 가능하도록 아이콘 준비 (`public/icons/`)
- 향후 푸시 알림 추가 가능 (Capacitor 또는 웹 푸시)

```js
// next.config.js 예시
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // next config
});
```

## Git 커밋 메시지

```
feat: 새로운 기능 추가
fix: 버그 수정
style: 스타일 변경
refactor: 리팩토링
docs: 문서 수정
```

## 환경 변수

- 클라이언트에서 사용: `NEXT_PUBLIC_` prefix 필수
- 서버에서만 사용: prefix 없음

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
SECRET_KEY=server-only-secret
```
