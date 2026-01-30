# Quickstart: 관리자 대시보드 주문 관리 (2차)

## Scope
- 주문 목록 조회/필터(상태, 결제상태, 기간, 유저), 주문 상세, 주문 상태 변경.
- 결제 정보 null → “결제 대기 중” 표준 표기.
- E2E는 API 통신만 검증, UI 요소 검증 제외.

## Steps
1) 타입 정의  
- 위치: `src/app/commons/types/orders.ts` (신규)  
- 내용: Order, Product, Payment(nullable), User, Pagination/Filters, API 응답 타입

2) API 모듈  
- 위치: `src/app/commons/apis/admin/orders.ts` (또는 기존 admin/dashboard 모듈 내 분리)  
- Axios 기반 GET 목록, GET 상세, PATCH 상태 변경 구현  
- 기본 파라미터: status/paymentStatus=ALL, limit=20, offset=0, created_at 내림차순 가정

3) React Query 훅  
- 위치: `src/app/commons/hooks/use-admin-orders.ts` (또는 dashboard 하위)  
- useQuery: 목록, 상세 / useMutation: 상태 변경  
- 상태 변경 성공 시 목록/상세 invalidate

4) E2E(API) - Playwright  
- 위치: `src/app/tests/api-tests/orders/orders-api.spec.ts`  
- 검증: HTTP 코드, success 플래그, items/total/limit/offset 스키마, payment null 케이스, 상세, 상태 변경

5) UI 구성  
- 컴포넌트: `src/app/components/Orders/` 내 테이블/필터/상세/모달  
- Radix + CSS Modules, 토스트/확인 모달 포함  
- 로딩/빈/오류 상태 뷰 제공, 반응형

6) Env & 실행  
- API BASE URL: `NEXT_PUBLIC_API_BASE_URL` (기존 ApiProvider 사용)  
- 테스트: `npm run test:e2e` (Playwright)

## Notes
- 필터 입력 검증: 시작일 > 종료일 등 잘못된 조합은 즉시 사용자에게 안내.  
- 상태 변경은 스펙 enum 5종만 전송, 백엔드 검증 에러는 토스트로 노출.  
- 목록/상세 모두 결제 null을 동일 표현으로 노출.  
- 성능 목표: 목록/필터 응답 5초 이내(스펙 SC-001/002), 상태 변경 후 목록 갱신 확인.
