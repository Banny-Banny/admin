# Data Model: 상품 관리

**Feature**: 상품 관리 페이지  
**Date**: 2026-01-27  
**Phase**: Phase 1 - Design

## Entities

### 1. 상품 (Product)

시스템에서 관리하는 상품 정보입니다.

**Attributes**:
- `id` (string, UUID, required): 상품 고유 식별자
- `name` (string, required): 상품명
- `price` (number, required): 상품 가격
- `description` (string, nullable): 상품 설명
- `thumbnailUrl` (string, nullable): 썸네일 이미지 URL
- `categoryId` (string, UUID, nullable): 카테고리 ID
- `productType` (ProductType enum, required): 상품 타입 (TIME_CAPSULE, EASTER_EGG 등)
- `mediaTypes` (string[], required): 미디어 타입 배열
- `maxMediaCount` (number | object, required): 최대 미디어 개수
- `isActive` (boolean, required): 활성화 여부
- `createdAt` (string, ISO 8601, required): 생성 일시
- `updatedAt` (string, ISO 8601, nullable): 수정 일시
- `deletedAt` (string, ISO 8601, nullable): 삭제 일시 (Soft Delete)

**Validation Rules**:
- `name`: 비어있지 않아야 함
- `price`: 0 이상의 숫자여야 함
- `productType`: 유효한 ProductType 값이어야 함
- `isActive`: boolean 값이어야 함

**State Transitions**:
- **생성**: 상품 등록 시 생성
- **활성화/비활성화**: `isActive` 필드로 제어
- **수정**: 상품 정보 업데이트
- **Soft Delete**: `deletedAt` 필드 설정, 실제 삭제는 아님

**Relationships**:
- 상품은 하나의 카테고리에 속할 수 있음 (`categoryId`)
- 상품은 여러 주문과 연결될 수 있음 (백엔드에서 관리)

---

### 2. 상품 목록 응답 (Product List Response)

상품 목록 조회 API의 응답입니다.

**Attributes**:
- `success` (boolean, required): 요청 성공 여부
- `data` (ProductListData, required): 상품 목록 데이터
  - `items` (Product[], required): 상품 배열
  - `total` (number, required): 전체 상품 개수
  - `limit` (number, required): 페이지 크기
  - `offset` (number, required): 페이지 오프셋

**Pagination**:
- `limit`: 기본값 20, 한 페이지에 표시할 상품 개수
- `offset`: 기본값 0, 시작 위치
- `total`: 전체 상품 개수 (필터 적용 후)

---

### 3. 상품 상세 응답 (Product Detail Response)

상품 상세 조회 API의 응답입니다.

**Attributes**:
- `success` (boolean, required): 요청 성공 여부
- `data` (Product, required): 상품 정보

---

### 4. 상품 등록 요청 (Create Product Request)

상품 등록 API의 요청 데이터입니다.

**Attributes**:
- `name` (string, required): 상품명
- `price` (number, required): 상품 가격
- `description` (string, optional): 상품 설명
- `thumbnailUrl` (string, optional): 썸네일 이미지 URL
- `categoryId` (string, UUID, optional): 카테고리 ID
- `isActive` (boolean, required): 활성화 여부
- `productType` (ProductType enum, required): 상품 타입
- `mediaTypes` (string[], required): 미디어 타입 배열
- `maxMediaCount` (number | object, required): 최대 미디어 개수

**Validation Rules**:
- `name`: 비어있지 않아야 함
- `price`: 0 이상의 숫자여야 함
- `productType`: 유효한 ProductType 값이어야 함

---

### 5. 상품 수정 요청 (Update Product Request)

상품 수정 API의 요청 데이터입니다.

**Attributes**:
- `name` (string, optional): 상품명
- `price` (number, optional): 상품 가격
- `description` (string | null, optional): 상품 설명
- `thumbnailUrl` (string | null, optional): 썸네일 이미지 URL
- `categoryId` (string | null, optional): 카테고리 ID
- `isActive` (boolean, optional): 활성화 여부
- `productType` (ProductType enum, optional): 상품 타입
- `mediaTypes` (string[], optional): 미디어 타입 배열
- `maxMediaCount` (number | object, optional): 최대 미디어 개수

**Note**: 모든 필드가 optional이므로 부분 업데이트 가능

---

### 6. 상품 목록 조회 파라미터 (Get Products Params)

상품 목록 조회 API의 쿼리 파라미터입니다.

**Attributes**:
- `search` (string, optional): 검색어 (상품명)
- `categoryId` (string, UUID, optional): 카테고리 ID 필터
- `status` (ProductStatus enum, optional): 상태 필터 (ALL, ACTIVE, INACTIVE, DELETED)
- `limit` (number, optional): 페이지 크기 (기본값: 20)
- `offset` (number, optional): 페이지 오프셋 (기본값: 0)

---

## Enums

### ProductType
```typescript
enum ProductType {
  TIME_CAPSULE = 'TIME_CAPSULE',
  EASTER_EGG = 'EASTER_EGG',
  // 기타 타입들...
}
```

### ProductStatus (API 파라미터용)
```typescript
enum ProductStatus {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED'
}
```

---

## Data Flow

### 상품 목록 조회 플로우

```
1. 사용자가 상품 관리 페이지 접근
2. GET /api/admin/products?search=...&categoryId=...&status=...&limit=20&offset=0 요청
3. 백엔드에서 필터링 및 페이지네이션 처리
4. ProductListResponse 수신
5. UI에 상품 목록 표시
```

### 상품 등록 플로우

```
1. 사용자가 상품 등록 폼 작성
2. CreateProductRequest 생성 및 검증
3. POST /api/admin/products 요청
4. 백엔드에서 상품 생성
5. 성공 응답 수신
6. 상품 목록 새로고침 또는 새 상품 추가
```

### 상품 수정 플로우

```
1. 사용자가 상품 상세 정보에서 수정 버튼 클릭
2. 수정 폼에 기존 데이터 로드
3. 사용자가 정보 수정
4. UpdateProductRequest 생성
5. PATCH /api/admin/products/{id} 요청
6. 백엔드에서 상품 정보 업데이트
7. 성공 응답 수신
8. 상품 목록 및 상세 정보 업데이트
```

### 상품 삭제 플로우 (Soft Delete)

```
1. 사용자가 상품 상세 정보에서 삭제 버튼 클릭
2. 삭제 확인 다이얼로그 표시
3. 사용자가 확인 클릭
4. DELETE /api/admin/products/{id} 요청
5. 백엔드에서 deletedAt 필드 설정
6. 성공 응답 수신
7. 상품 목록에서 제거 (또는 DELETED 상태로 표시)
```

---

## TypeScript Interfaces

```typescript
// 상품 타입 열거형
export enum ProductType {
  TIME_CAPSULE = 'TIME_CAPSULE',
  EASTER_EGG = 'EASTER_EGG',
}

// 상품 상태 열거형 (API 파라미터용)
export enum ProductStatus {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
}

// 상품 엔티티
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  thumbnailUrl: string | null;
  categoryId: string | null;
  productType: ProductType;
  mediaTypes: string[];
  maxMediaCount: number | object;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

// 상품 목록 응답
export interface ProductListResponse {
  success: boolean;
  data: {
    items: Product[];
    total: number;
    limit: number;
    offset: number;
  };
}

// 상품 상세 응답
export interface ProductDetailResponse {
  success: boolean;
  data: Product;
}

// 상품 등록 요청
export interface CreateProductRequest {
  name: string;
  price: number;
  description?: string;
  thumbnailUrl?: string;
  categoryId?: string;
  isActive: boolean;
  productType: ProductType;
  mediaTypes: string[];
  maxMediaCount: number | object;
}

// 상품 수정 요청
export interface UpdateProductRequest {
  name?: string;
  price?: number;
  description?: string | null;
  thumbnailUrl?: string | null;
  categoryId?: string | null;
  isActive?: boolean;
  productType?: ProductType;
  mediaTypes?: string[];
  maxMediaCount?: number | object;
}

// 상품 목록 조회 파라미터
export interface GetProductsParams {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  limit?: number;
  offset?: number;
}
```

---

## API 응답 형식

### 성공 응답 (공통)
```typescript
{
  success: true,
  data: T  // T는 응답 데이터 타입
}
```

### 에러 응답
```typescript
{
  success: false,
  error?: string,
  message?: string
}
```

### HTTP 상태 코드
- `200`: 성공
- `400`: 잘못된 요청 (검증 실패 등)
- `401`: 인증 실패 (토큰 만료 등)
- `404`: 상품을 찾을 수 없음
- `500`: 서버 오류

---

## Validation Rules Summary

| 필드 | 규칙 | 검증 위치 |
|------|------|----------|
| name | 비어있지 않음 | 클라이언트, 서버 |
| price | 0 이상의 숫자 | 클라이언트, 서버 |
| productType | 유효한 ProductType 값 | 클라이언트, 서버 |
| isActive | boolean 값 | 클라이언트, 서버 |
| categoryId | 유효한 UUID 형식 (nullable) | 서버 |
| thumbnailUrl | 유효한 URL 형식 (nullable) | 서버 |
| search | 문자열 (특수문자 허용) | 서버 |
| status | 유효한 ProductStatus 값 | 클라이언트, 서버 |
| limit | 양수 (기본값: 20) | 서버 |
| offset | 0 이상 (기본값: 0) | 서버 |
