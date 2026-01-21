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

// ============================================================================
// API 함수
// ============================================================================

/**
 * 상품 목록 조회
 * @param params - 검색, 필터링, 페이지네이션 파라미터
 * @returns 상품 목록 응답
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
 * @param id - 상품 ID (UUID)
 * @returns 상품 상세 응답
 */
export async function getProductById(id: string): Promise<ProductDetailResponse> {
  return apiClient.get<ProductDetailResponse>(`/api/admin/products/${id}`);
}

/**
 * 상품 등록
 * @param data - 상품 등록 요청 데이터
 * @returns 상품 상세 응답
 */
export async function createProduct(
  data: CreateProductRequest
): Promise<ProductDetailResponse> {
  return apiClient.post<ProductDetailResponse>('/api/admin/products', data);
}

/**
 * 상품 정보 수정
 * @param id - 상품 ID (UUID)
 * @param data - 상품 수정 요청 데이터
 * @returns 상품 상세 응답
 */
export async function updateProduct(
  id: string,
  data: UpdateProductRequest
): Promise<ProductDetailResponse> {
  return apiClient.patch<ProductDetailResponse>(`/api/admin/products/${id}`, data);
}

/**
 * 상품 삭제 (Soft Delete)
 * @param id - 상품 ID (UUID)
 * @returns 삭제 응답
 */
export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
  return apiClient.delete<{ success: boolean; message?: string }>(`/api/admin/products/${id}`);
}
