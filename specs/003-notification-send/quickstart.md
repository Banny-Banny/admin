# Quickstart: 유저 알림 메시지 발송 기능

**Branch**: `003-notification-send`  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

## 1) 개발 환경 준비
- `npm install` (필요 시)
- `npm run dev` 로컬 실행 (Next.js)
- E2E 테스트: `npm run test:e2e` (Playwright)

## 2) 코드 변경 위치
- 폴더 생성: `src/app/commons/apis/notification/`
  - `index.ts` : 알림 발송 API 함수
  - `types.ts` : 요청/응답 타입 정의
- 컴포넌트: `src/app/components/MarketingPage/index.tsx`
  - 폼 유효성 검사 및 버튼 활성/비활성 로직 추가
  - 메시지 유형/대상 셀렉트, 제목/내용 필수 처리
- 테스트: `src/app/tests/api-tests/notification-test/notification.spec.ts`
  - 제목/내용 미입력 시 버튼 비활성
  - 제목/내용 입력 시 버튼 활성 + 발송 성공 플로우

## 3) 구현 순서 (권장)
1. **타입 정의**: `types.ts`에 `SendNotificationRequest/Response` 정의  
2. **API 함수**: `index.ts`에 `sendNotification` 구현 (apiClient.post)  
3. **컴포넌트 수정**: `MarketingPage/index.tsx`에서 폼 상태와 `isFormValid` 반영, 버튼 `disabled` 처리  
4. **테스트 작성**: Playwright E2E로 버튼 활성/비활성, 발송 성공 시나리오 검증  
5. **수동 점검**: 제목/내용 공백-only 입력, 예약 발송 시 날짜/시간 필수 여부 확인  

## 4) 주요 유효성 기준
- 제목/내용: 공백-only 불가, 둘 다 있어야 즉시 발송 버튼 활성
- 유형/대상: 필수 선택
- 예약 발송: 날짜/시간 필수 (UI min date 오늘 기준)

## 5) 실행/검증
- 로컬 실행 후 MarketingPage에서 즉시 발송 플로우 수동 확인
- `npm run test:e2e` 로 자동 검증

## 6) 참고
- API 스펙: [contracts/notification-api.yaml](./contracts/notification-api.yaml)
- 데이터 모델: [data-model.md](./data-model.md)
