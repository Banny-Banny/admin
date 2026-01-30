# Quick Start: 상품 관리 페이지 개발

**Feature**: 상품 관리 페이지  
**Date**: 2026-01-27

## 개요

이 문서는 상품 관리 페이지를 구현하기 위한 빠른 시작 가이드입니다. 진행 순서는 API 연결 → E2E 테스트 → UI 데이터 바인딩입니다.

## 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- 백엔드 API 서버 실행 중
- 환경 변수 설정 (`.env.local`)
- 관리자 인증 완료 (토큰 필요)

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# 또는 프로덕션 URL
```

## 구현 단계

### 1. 타입 정의 생성

**파일**: `src/app/commons/types/product.ts`

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

### 2. API 클라이언트 생성

**파일**: `src/app/commons/apis/product/http.ts`

```typescript
import { apiClient } from '../../provider/api-provider/api-client';
import type {
  Product,
  ProductListResponse,
  ProductDetailResponse,
  CreateProductRequest,
  UpdateProductRequest,
  GetProductsParams,
} from '../../types/product';

/**
 * 상품 목록 조회
 * @param params 검색, 필터링, 페이지네이션 파라미터
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
 * @param id 상품 ID
 * @returns 상품 상세 응답
 */
export async function getProductById(id: string): Promise<ProductDetailResponse> {
  return apiClient.get<ProductDetailResponse>(`/api/admin/products/${id}`);
}

/**
 * 상품 등록
 * @param data 상품 등록 데이터
 * @returns 상품 상세 응답
 */
export async function createProduct(
  data: CreateProductRequest
): Promise<ProductDetailResponse> {
  return apiClient.post<ProductDetailResponse>('/api/admin/products', data);
}

/**
 * 상품 정보 수정
 * @param id 상품 ID
 * @param data 상품 수정 데이터
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
 * @param id 상품 ID
 * @returns 삭제 성공 응답
 */
export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
  return apiClient.delete<{ success: boolean; message?: string }>(`/api/admin/products/${id}`);
}
```

**파일**: `src/app/commons/apis/product/index.ts`

```typescript
export * from './http';
export * from '../../types/product';
```

### 3. ProductsPage 컴포넌트 수정

**파일**: `src/app/components/ProductsPage/index.tsx`

```typescript
'use client';
import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { ProductList } from '../ProductList';
import { createProduct, getProducts } from '../../commons/apis/product';
import type { Product, CreateProductRequest, ProductStatus } from '../../commons/types/product';
import styles from './styles.module.css';

export function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    description: '',
    isActive: true,
    productType: 'TIME_CAPSULE' as const,
    mediaTypes: [] as string[],
    maxMediaCount: 6,
  });

  // 상품 목록 조회
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts({ status: 'ACTIVE' });
      if (response.success && response.data) {
        setProducts(response.data.items);
      }
    } catch (error) {
      console.error('상품 목록 조회 실패:', error);
      toast.error('상품 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const requestData: CreateProductRequest = {
        name: formData.name,
        price: Number(formData.price),
        description: formData.description || undefined,
        categoryId: formData.categoryId || undefined,
        isActive: formData.isActive,
        productType: formData.productType,
        mediaTypes: formData.mediaTypes,
        maxMediaCount: formData.maxMediaCount,
      };

      const response = await createProduct(requestData);
      if (response.success && response.data) {
        toast.success('상품이 등록되었습니다');
        setProducts([response.data, ...products]);
        setFormData({
          name: '',
          categoryId: '',
          price: '',
          description: '',
          isActive: true,
          productType: 'TIME_CAPSULE',
          mediaTypes: [],
          maxMediaCount: 6,
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('상품 등록 실패:', error);
      toast.error('상품 등록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading && products.length === 0) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className={styles.c_1j8i8bf}>
      {/* 기존 JSX 유지, API 연동 추가 */}
      {/* ... */}
    </div>
  );
}
```

### 4. ProductList 컴포넌트 수정

**파일**: `src/app/components/ProductList/index.tsx`

```typescript
'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getProducts } from '../../commons/apis/product';
import type { Product, ProductStatus } from '../../commons/types/product';
import styles from './styles.module.css';

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus>('ACTIVE');

  useEffect(() => {
    loadProducts();
  }, [searchTerm, categoryFilter, statusFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts({
        search: searchTerm || undefined,
        categoryId: categoryFilter || undefined,
        status: statusFilter,
        limit: 20,
        offset: 0,
      });
      
      if (response.success && response.data) {
        setProducts(response.data.items);
      }
    } catch (error) {
      console.error('상품 목록 조회 실패:', error);
      toast.error('상품 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 기존 JSX 유지, products 상태를 API 데이터로 교체
  // ...
}
```

### 5. E2E 테스트 작성

**파일**: `src/app/tests/api-tests/product-test/product-api.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'https://be-production-8aa2.up.railway.app';
let authToken: string;

test.beforeAll(async ({ request }) => {
  // 로그인하여 토큰 획득
  const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
    data: {
      email: 'admin@example.com',
      password: 'password123',
    },
  });
  
  const loginData = await loginResponse.json();
  authToken = loginData.accessToken;
});

test('상품 목록 조회', async ({ request }) => {
  const response = await request.get(`${API_BASE_URL}/api/admin/products`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.data).toHaveProperty('items');
  expect(data.data).toHaveProperty('total');
  expect(data.data).toHaveProperty('limit');
  expect(data.data).toHaveProperty('offset');
});

test('상품 등록', async ({ request }) => {
  const productData = {
    name: '테스트 상품',
    price: 10000,
    description: '테스트 설명',
    isActive: true,
    productType: 'TIME_CAPSULE',
    mediaTypes: ['TEXT'],
    maxMediaCount: 6,
  };

  const response = await request.post(`${API_BASE_URL}/api/admin/products`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    data: productData,
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.data.name).toBe(productData.name);
});

test('상품 상세 조회', async ({ request }) => {
  // 먼저 상품 목록을 조회하여 ID 획득
  const listResponse = await request.get(`${API_BASE_URL}/api/admin/products`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  
  const listData = await listResponse.json();
  const productId = listData.data.items[0]?.id;
  
  if (!productId) {
    test.skip();
    return;
  }

  const response = await request.get(`${API_BASE_URL}/api/admin/products/${productId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.data.id).toBe(productId);
});

test('상품 수정', async ({ request }) => {
  // 상품 목록 조회하여 ID 획득
  const listResponse = await request.get(`${API_BASE_URL}/api/admin/products`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  
  const listData = await listResponse.json();
  const productId = listData.data.items[0]?.id;
  
  if (!productId) {
    test.skip();
    return;
  }

  const updateData = {
    price: 15000,
  };

  const response = await request.patch(`${API_BASE_URL}/api/admin/products/${productId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    data: updateData,
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.data.price).toBe(updateData.price);
});

test('상품 삭제 (Soft Delete)', async ({ request }) => {
  // 상품 목록 조회하여 ID 획득
  const listResponse = await request.get(`${API_BASE_URL}/api/admin/products`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  
  const listData = await listResponse.json();
  const productId = listData.data.items[0]?.id;
  
  if (!productId) {
    test.skip();
    return;
  }

  const response = await request.delete(`${API_BASE_URL}/api/admin/products/${productId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
});
```

## 테스트 실행

### E2E 테스트 실행

```bash
npm run test:e2e
```

### 개발 서버 실행

```bash
npm run dev
```

## 다음 단계

1. 상품 수정/삭제 UI 추가
2. 페이지네이션 구현
3. 이미지 업로드 기능 추가
4. 에러 처리 개선
5. 로딩 상태 UI 개선

## 참고 자료

- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [Axios 문서](https://axios-http.com/)
- [Playwright 문서](https://playwright.dev/)
- [OpenAPI 스펙](./contracts/admin-products-api.yaml)
