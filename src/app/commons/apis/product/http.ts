import { apiClient } from '../../provider/api-provider/api-client';

// ============================================================================
// 타입 정의
// ============================================================================

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
  thumbnail?: File;  // 파일 객체 추가
  thumbnailUrl?: string;  // URL도 여전히 지원 (호환성)
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
  thumbnail?: File;  // 파일 객체 추가
  thumbnailUrl?: string | null;  // URL도 여전히 지원 (호환성)
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

// ============================================================================
// API 함수
// ============================================================================

/**
 * 상품 목록 조회
 * 
 * 검색어, 카테고리, 상태 필터를 사용하여 상품 목록을 조회합니다.
 * 페이지네이션을 지원하며, limit과 offset을 통해 페이지 크기와 시작 위치를 지정할 수 있습니다.
 * 
 * @param params - 검색, 필터링, 페이지네이션 파라미터
 *   - search: 상품명 검색어 (선택)
 *   - categoryId: 카테고리 ID 필터 (선택)
 *   - status: 상태 필터 (ALL, ACTIVE, INACTIVE, DELETED) (선택)
 *   - limit: 페이지 크기 (기본값: 20) (선택)
 *   - offset: 페이지 오프셋 (기본값: 0) (선택)
 * @returns 상품 목록 응답 (items, total, limit, offset 포함)
 * @throws {AxiosError} API 요청 실패 시
 * 
 * @example
 * ```typescript
 * // 모든 상품 조회
 * const response = await getProducts();
 * 
 * // 검색어로 필터링
 * const response = await getProducts({ search: '타임캡슐' });
 * 
 * // 활성화된 상품만 조회
 * const response = await getProducts({ status: ProductStatus.ACTIVE });
 * 
 * // 페이지네이션
 * const response = await getProducts({ limit: 10, offset: 20 });
 * ```
 */
export async function getProducts(
  params?: GetProductsParams
): Promise<ProductListResponse> {
  const queryParams = new URLSearchParams();

  if (params?.search) {
    queryParams.append('search', params.search);
  }
  if (params?.categoryId) {
    queryParams.append('categoryId', params.categoryId);
  }
  if (params?.status) {
    queryParams.append('status', params.status);
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/products${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<ProductListResponse>(endpoint);
}

/**
 * 상품 상세 조회
 * 
 * 상품 ID를 사용하여 특정 상품의 상세 정보를 조회합니다.
 * 
 * @param id - 상품 ID (UUID 형식)
 * @returns 상품 상세 응답 (Product 객체 포함)
 * @throws {AxiosError} API 요청 실패 시 (404: 상품을 찾을 수 없음)
 * 
 * @example
 * ```typescript
 * const product = await getProductById('123e4567-e89b-12d3-a456-426614174000');
 * console.log(product.data.name); // 상품명
 * ```
 */
export async function getProductById(id: string): Promise<ProductDetailResponse> {
  return apiClient.get<ProductDetailResponse>(`/api/admin/products/${id}`);
}

/**
 * 상품 등록
 * 
 * 새로운 상품을 등록합니다. 필수 필드(name, price, productType, mediaTypes, maxMediaCount, isActive)를 포함해야 합니다.
 * 
 * @param data - 상품 등록 요청 데이터
 *   - name: 상품명 (필수)
 *   - price: 상품 가격 (필수, 0 이상)
 *   - productType: 상품 타입 (TIME_CAPSULE, EASTER_EGG) (필수)
 *   - mediaTypes: 미디어 타입 배열 (필수, 최소 1개)
 *   - maxMediaCount: 최대 미디어 개수 (필수, 1-3)
 *   - isActive: 활성화 여부 (필수)
 *   - description: 상품 설명 (선택)
 *   - thumbnailUrl: 썸네일 이미지 URL (선택)
 *   - categoryId: 카테고리 ID (선택)
 * @returns 상품 상세 응답 (생성된 상품 정보)
 * @throws {AxiosError} API 요청 실패 시 (400: 검증 실패, 401: 인증 실패)
 * 
 * @example
 * ```typescript
 * const newProduct = await createProduct({
 *   name: '새 타임캡슐',
 *   price: 10000,
 *   productType: ProductType.TIME_CAPSULE,
 *   mediaTypes: ['TEXT', 'IMAGE'],
 *   maxMediaCount: 2,
 *   isActive: true,
 *   description: '설명',
 * });
 * ```
 */
export async function createProduct(
  data: CreateProductRequest
): Promise<ProductDetailResponse> {
  const formData = new FormData();
  
  formData.append('name', data.name);
  formData.append('price', data.price.toString());
  formData.append('productType', data.productType);
  formData.append('isActive', data.isActive.toString());
  
  // mediaTypes 배열의 각 요소를 개별적으로 append
  // 백엔드가 FormData에서 배열을 올바르게 파싱할 수 있도록
  data.mediaTypes.forEach((type) => {
    formData.append('mediaTypes', type);
  });
  
  // maxMediaCount는 number 또는 object일 수 있음
  if (typeof data.maxMediaCount === 'number') {
    formData.append('maxMediaCount', data.maxMediaCount.toString());
  } else {
    formData.append('maxMediaCount', JSON.stringify(data.maxMediaCount));
  }
  
  // 선택적 필드들
  if (data.description) {
    formData.append('description', data.description);
  }
  
  // 파일 업로드 우선, 없으면 URL 사용
  if (data.thumbnail) {
    formData.append('thumbnail', data.thumbnail);
  } else if (data.thumbnailUrl) {
    formData.append('thumbnailUrl', data.thumbnailUrl);
  }
  
  if (data.categoryId) {
    formData.append('categoryId', data.categoryId);
  }
  
  return apiClient.post<ProductDetailResponse>('/api/admin/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 상품 정보 수정
 * 
 * 기존 상품의 정보를 부분 업데이트합니다. 변경하려는 필드만 포함하면 됩니다.
 * 
 * @param id - 상품 ID (UUID 형식)
 * @param data - 상품 수정 요청 데이터 (모든 필드 선택)
 *   - name: 상품명 (선택)
 *   - price: 상품 가격 (선택)
 *   - productType: 상품 타입 (선택)
 *   - mediaTypes: 미디어 타입 배열 (선택)
 *   - maxMediaCount: 최대 미디어 개수 (선택, 1-3)
 *   - isActive: 활성화 여부 (선택)
 *   - description: 상품 설명 (선택, null로 설정 가능)
 *   - thumbnailUrl: 썸네일 이미지 URL (선택, null로 설정 가능)
 *   - categoryId: 카테고리 ID (선택, null로 설정 가능)
 * @returns 상품 상세 응답 (수정된 상품 정보)
 * @throws {AxiosError} API 요청 실패 시 (400: 검증 실패, 401: 인증 실패, 404: 상품을 찾을 수 없음)
 * 
 * @example
 * ```typescript
 * // 가격만 수정
 * await updateProduct('123e4567-e89b-12d3-a456-426614174000', { price: 15000 });
 * 
 * // 여러 필드 수정
 * await updateProduct('123e4567-e89b-12d3-a456-426614174000', {
 *   name: '수정된 상품명',
 *   price: 20000,
 *   isActive: false,
 * });
 * ```
 */
export async function updateProduct(
  id: string,
  data: UpdateProductRequest
): Promise<ProductDetailResponse> {
  const formData = new FormData();
  
  // 필드가 존재하는 경우에만 추가
  if (data.name !== undefined) {
    formData.append('name', data.name);
  }
  if (data.price !== undefined) {
    formData.append('price', data.price.toString());
  }
  if (data.description !== undefined) {
    formData.append('description', data.description || '');
  }
  if (data.productType !== undefined) {
    formData.append('productType', data.productType);
  }
  if (data.isActive !== undefined) {
    formData.append('isActive', data.isActive.toString());
  }
  
  // mediaTypes 배열의 각 요소를 개별적으로 append
  if (data.mediaTypes !== undefined) {
    data.mediaTypes.forEach((type) => {
      formData.append('mediaTypes', type);
    });
  }
  
  // maxMediaCount는 number 또는 object일 수 있음
  if (data.maxMediaCount !== undefined) {
    if (typeof data.maxMediaCount === 'number') {
      formData.append('maxMediaCount', data.maxMediaCount.toString());
    } else {
      formData.append('maxMediaCount', JSON.stringify(data.maxMediaCount));
    }
  }
  
  // 파일 업로드 우선, 없으면 URL 사용
  if (data.thumbnail) {
    formData.append('thumbnail', data.thumbnail);
  } else if (data.thumbnailUrl !== undefined) {
    formData.append('thumbnailUrl', data.thumbnailUrl || '');
  }
  
  if (data.categoryId !== undefined) {
    formData.append('categoryId', data.categoryId || '');
  }
  
  return apiClient.patch<ProductDetailResponse>(`/api/admin/products/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 상품 삭제 (Soft Delete)
 * 
 * 상품을 삭제합니다. 실제로 데이터베이스에서 삭제되지 않고 deletedAt 필드가 설정됩니다.
 * 
 * @param id - 상품 ID (UUID 형식)
 * @returns 삭제 응답 (success: boolean, message?: string)
 * @throws {AxiosError} API 요청 실패 시 (401: 인증 실패, 404: 상품을 찾을 수 없음)
 * 
 * @example
 * ```typescript
 * const result = await deleteProduct('123e4567-e89b-12d3-a456-426614174000');
 * if (result.success) {
 *   console.log('상품이 삭제되었습니다.');
 * }
 * ```
 */
export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
  return apiClient.delete<{ success: boolean; message?: string }>(`/api/admin/products/${id}`);
}
