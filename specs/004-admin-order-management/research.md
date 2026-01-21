# Research: 관리자 대시보드 주문 관리 (2차)

## Decisions & Rationale

### 목록 조회 필터/페이지네이션 기본값
- **Decision**: status/paymentStatus 기본값 `ALL`, limit 20, offset 0, created_at 내림차순 기본 정렬로 가정.
- **Rationale**: 사용자 입력이 없을 때 가장 넓은 범위와 보편적 페이지 크기를 제공해 탐색성을 높임. 생성 시각 역순이 운영 모니터링에 적합.
- **Alternatives considered**: 상태 기본값을 `PENDING`으로 제한 → 신규 주문만 보이지만 누락 위험. 정렬을 최신 결제 시각 기준으로 변경 → 결제 없는 주문에서 정의 모호.

### 상태/결제 상태 전이
- **Decision**: PATCH 요청으로 전달 가능한 상태는 스펙에 명시된 5종(`PENDING`, `PENDING_PAYMENT`, `PAID`, `CANCELED`, `FAILED`)으로 한정. 백엔드가 유효성 검사/허용 불가 시 에러를 반환한다고 전제.
- **Rationale**: 명시된 값 외 전이는 정의되지 않았으며, 운영 안전성을 위해 허용 집합을 제한.
- **Alternatives considered**: 프론트에서 전이 그래프를 정의해 제한 → 백엔드 정책 미확정 시 과도 제약 가능. 전이 제한을 두지 않음 → 오입력 위험.

### 결제 정보 null 표시
- **Decision**: payment가 null이면 목록/상세 모두 “결제 대기 중”으로 표준화 표기.
- **Rationale**: “오류”로 오해되는 것을 방지하고 운영자가 후속 액션을 명확히 인지하도록 함.
- **Alternatives considered**: 빈 값/대시 표기 → 의미 모호. “결제 정보 없음” → 대기/실패 구분 불명확.

### 에러/빈 상태 처리
- **Decision**: 로딩/오류/빈 결과 각각의 UI 메시지/재시도 흐름을 필수화. 필터 오류(예: 시작일 > 종료일)는 즉시 사용자에게 안내.
- **Rationale**: 관리 콘솔 특성상 빠른 회복과 원인 인지가 중요.
- **Alternatives considered**: 단순 토스트만 표시 → 해결 행동이 불명확.

### 테스트 범위
- **Decision**: Playwright로 API 호출만 검증 (HTTP 코드, success, 데이터 스키마, payment null). UI 요소 검증 제외.
- **Rationale**: 스펙의 “API 통신만 테스트, UI는 제외” 요구 명시.
- **Alternatives considered**: UI까지 포함한 종단 테스트 → 범위 초과 및 스펙 위배.
