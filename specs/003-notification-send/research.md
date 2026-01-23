# Research: 유저 알림 메시지 발송 기능

**Date**: 2026-01-16  
**Feature**: 유저 알림 메시지 발송 기능

## 기술 스택 결정

### Decision: 기존 기술 스택 활용

**Rationale**: 
- 프로젝트가 이미 Next.js 16.1.3, React 19.2.3, TypeScript 5로 구성되어 있음
- 기존 API 클라이언트 패턴(Axios 기반)이 잘 구축되어 있음
- 일관성 있는 코드베이스 유지가 중요함

**Alternatives considered**:
- 새로운 상태 관리 라이브러리 도입 (Zustand, Jotai 등) → 기존 React useState로 충분
- 새로운 폼 라이브러리 도입 → React Hook Form이 이미 프로젝트에 포함되어 있음

## 아키텍처 결정

### Decision: 기존 API 클라이언트 패턴 활용

**Rationale**:
- 기존 `src/app/commons/apis/` 구조를 따라 `notification/` 폴더 생성
- `apiClient`를 통한 일관된 API 호출 패턴 유지
- 타입 안정성을 위한 TypeScript 인터페이스 정의

**Implementation Pattern**:
```typescript
// src/app/commons/apis/notification/index.ts
import { apiClient } from '../../provider/api-provider/api-client';

export interface SendNotificationRequest {
  title: string;
  content: string;
  type: '광고' | '안내' | '이벤트' | '업데이트';
  target: '전체 회원' | '활성 회원' | '휴면 회원' | 'VIP 회원';
  sendNow: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

export async function sendNotification(data: SendNotificationRequest) {
  return apiClient.post('/api/admin/notifications', data);
}
```

**Alternatives considered**:
- 직접 Axios 호출 → 기존 패턴과 불일치
- GraphQL 사용 → REST API가 이미 구축되어 있음

### Decision: 컴포넌트 내부 상태 관리

**Rationale**:
- 단일 페이지 컴포넌트 내에서만 사용되는 상태
- 복잡한 전역 상태 관리 불필요
- React useState와 useEffect로 충분

**Implementation Pattern**:
```typescript
const [formData, setFormData] = useState({
  title: '',
  content: '',
  type: '안내' as MessageType,
  target: '전체 회원',
  sendNow: true,
});

const isFormValid = formData.title.trim() !== '' && formData.content.trim() !== '';
```

**Alternatives considered**:
- Context API 사용 → 단일 컴포넌트에서만 사용되므로 불필요
- 전역 상태 관리 (Zustand, Redux) → 과도한 복잡도

## 폴더 구조 결정

### Decision: 기존 프로젝트 구조 준수

**Rationale**:
- `src/app/commons/apis/` 패턴을 따라 `notification/` 폴더 생성
- `src/app/components/MarketingPage/` 기존 컴포넌트 수정
- `src/app/tests/api-tests/` 패턴을 따라 `notification-test/` 폴더 생성

**Folder Structure**:
```
src/app/
├── commons/
│   └── apis/
│       └── notification/
│           ├── index.ts      # API 함수들
│           └── types.ts      # TypeScript 타입 정의
├── components/
│   └── MarketingPage/
│       ├── index.tsx          # 기존 컴포넌트 수정
│       └── styles.module.css  # 기존 스타일
└── tests/
    └── api-tests/
        └── notification-test/
            └── notification.spec.ts
```

**Alternatives considered**:
- 별도의 `notification/` 컴포넌트 폴더 생성 → 기존 MarketingPage에 통합하는 것이 더 자연스러움
- API를 `marketing/` 폴더에 배치 → 기능별로 분리하는 것이 더 명확함

## 폼 유효성 검사 전략

### Decision: 실시간 유효성 검사 + React Hook Form

**Rationale**:
- 제목과 내용 입력 상태에 따라 즉시 발송 버튼 활성화/비활성화
- React Hook Form이 이미 프로젝트에 포함되어 있음
- 사용자 경험 향상 (즉시 피드백)

**Implementation Pattern**:
```typescript
const { register, watch, formState: { errors } } = useForm();

const title = watch('title');
const content = watch('content');
const isFormValid = title?.trim() !== '' && content?.trim() !== '';

<button 
  type="submit" 
  disabled={!isFormValid}
>
  즉시 발송
</button>
```

**Alternatives considered**:
- 제출 시에만 유효성 검사 → 사용자 경험이 나쁨
- 커스텀 유효성 검사 로직 → React Hook Form이 더 표준적

## API 엔드포인트 설계

### Decision: RESTful API 패턴

**Rationale**:
- 기존 API 패턴과 일관성 유지
- `/api/admin/notifications` 엔드포인트 사용
- POST 메서드로 메시지 발송

**API Design**:
```
POST /api/admin/notifications
Body: {
  title: string;
  content: string;
  type: '광고' | '안내' | '이벤트' | '업데이트';
  target: '전체 회원' | '활성 회원' | '휴면 회원' | 'VIP 회원';
  sendNow: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}
```

**Alternatives considered**:
- GraphQL → REST API가 이미 구축되어 있음
- WebSocket → 실시간 통신이 필요하지 않음

## 테스트 전략

### Decision: Playwright E2E 테스트

**Rationale**:
- 기존 프로젝트에 Playwright가 이미 설정되어 있음
- E2E 테스트로 사용자 시나리오 검증
- 기존 테스트 구조(`src/app/tests/api-tests/`) 패턴 준수

**Test Structure**:
```typescript
// src/app/tests/api-tests/notification-test/notification.spec.ts
test('메시지 발송 - 제목과 내용 입력 시 즉시 발송 버튼 활성화', async ({ page }) => {
  // 테스트 로직
});
```

**Alternatives considered**:
- 단위 테스트 (Jest) → E2E 테스트가 사용자 시나리오 검증에 더 적합
- 수동 테스트 → 자동화된 테스트가 더 안정적

## 결론

모든 기술적 결정은 기존 프로젝트 구조와 패턴을 최대한 활용하여 일관성을 유지하는 방향으로 결정되었습니다. 추가적인 외부 라이브러리나 복잡한 아키텍처 변경 없이 기존 인프라를 활용하여 기능을 구현할 수 있습니다.
