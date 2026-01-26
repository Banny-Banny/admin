# Data Model: 유저 알림 메시지 발송 기능

**Date**: 2026-01-16  
**Source**: [spec.md](./spec.md) | [plan.md](./plan.md) | [research.md](./research.md)

## Entities

### NotificationMessage
- **id**: string | 메시지 식별자 (UI 내에서 생성된 임시 ID 가능)
- **title**: string | 필수 | 최대 200자 (가정) | 공백-only 불가
- **content**: string | 필수 | 최대 2000자 (가정) | 공백-only 불가
- **type**: enum<'광고'|'안내'|'이벤트'|'업데이트'> | 필수
- **target**: enum<'전체 회원'|'활성 회원'|'휴면 회원'|'VIP 회원'> | 필수
- **sendNow**: boolean | 필수 | true: 즉시 발송, false: 예약 발송
- **scheduledDate**: string (YYYY-MM-DD) | 선택 | sendNow=false일 때 필수
- **scheduledTime**: string (HH:mm) | 선택 | sendNow=false일 때 필수
- **status**: enum<'발송완료'|'발송대기'|'예약'> | 기본값: sendNow ? '발송완료' : '예약'
- **sentAt**: string (YYYY-MM-DD HH:mm) | 발송/예약 시각
- **recipients**: number | 수신자 수 (대상 그룹에 따른 계산 값)
- **openRate**: number | 오픈율(%), 즉시 발송 시 초기값 0~80 랜덤(가정), 예약 시 0

## Validation Rules
- title: 필수, 공백-only 불가, 최대 200자 가정
- content: 필수, 공백-only 불가, 최대 2000자 가정
- type: 필수, 허용 enum만
- target: 필수, 허용 enum만
- sendNow=false일 때: scheduledDate, scheduledTime 필수
- 즉시 발송 버튼 활성화 조건: title.trim().length>0 AND content.trim().length>0

## Derived / Behavioral Notes
- recipients는 target에 따라 계산: 전체 회원(1523), 활성 회원(982), 휴면 회원(435), VIP 회원(106) (UI 가정)
- status는 sendNow 여부에 따라 기본 설정
- sentAt은 현재 시각 또는 예약 시각을 포맷팅하여 저장

## Relationships
- 단일 엔티티(알림 메시지) 중심. 현재 다른 엔티티와의 관계 없음. 향후 사용자/채널 엔티티 연계 가능.

## State Transitions
- Draft (폼 작성) → Ready (모든 필수 입력 완료) → Sent(발송완료) | Scheduled(예약) → (옵션) Delivered/Opened 추적 가능성

## Edge Cases (Data Layer 관점)
- 공백-only 입력 거부
- 예약 발송 시 과거 날짜/시간 입력 방지 필요 (UI에서 min 날짜 설정)
- 잘못된 enum 값 거부
- recipients 계산 대상 값이 0인 경우 경고 또는 비발송 처리 (가정)
