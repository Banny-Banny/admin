import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 직접 로드 (Playwright 워커 프로세스에서도 동작하도록)
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

// API_BASE_URL은 절대 URL로 사용해야 함 (Playwright request는 baseURL을 사용하지 않음)
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://be-production-8aa2.up.railway.app').replace(/\/$/, '');

// 테스트용 관리자 계정 (.env 파일에서 읽어옴)
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'password123',
};

let adminAccessToken: string;
let createdProductId: string | null = null;

test.describe('상품 관리 API E2E 테스트', () => {
  // 로그인하여 토큰 획득
  test.beforeAll(async ({ request }) => {
    // 환경 변수 확인 (디버깅용)
    if (!TEST_ADMIN.email || !TEST_ADMIN.password) {
      console.error('환경 변수가 설정되지 않았습니다:', {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password ? '***' : undefined,
        envEmail: process.env.TEST_ADMIN_EMAIL,
        envPassword: process.env.TEST_ADMIN_PASSWORD ? '***' : undefined,
      });
    }

    const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
      data: {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
      },
    });

    if (!loginResponse.ok()) {
      const errorBody = await loginResponse.text();
      console.error('로그인 실패:', {
        status: loginResponse.status(),
        statusText: loginResponse.statusText(),
        requestUrl: `${API_BASE_URL}/api/admin/auth/login`,
        actualUrl: loginResponse.url(),
        body: errorBody.substring(0, 200),
        email: TEST_ADMIN.email,
      });
    }

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    adminAccessToken = loginData.accessToken;
    expect(adminAccessToken).toBeTruthy();
  });

  test('상품 목록 조회 API 테스트', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/admin/products`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 응답 구조 검증
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('items');
    expect(data.data).toHaveProperty('total');
    expect(data.data).toHaveProperty('limit');
    expect(data.data).toHaveProperty('offset');
    expect(Array.isArray(data.data.items)).toBeTruthy();
    
    // items의 구조 검증
    if (data.data.items.length > 0) {
      const item = data.data.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('productType');
      expect(item).toHaveProperty('mediaTypes');
      expect(item).toHaveProperty('maxMediaCount');
      expect(item).toHaveProperty('isActive');
      expect(item).toHaveProperty('createdAt');
    }
  });

  test('상품 목록 조회 - 검색 필터 테스트', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/admin/products?search=타임캡슐`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data.items)).toBeTruthy();
  });

  test('상품 목록 조회 - 상태 필터 테스트', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/admin/products?status=ACTIVE`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 모든 상품이 ACTIVE 상태인지 확인
    if (data.data.items.length > 0) {
      data.data.items.forEach((product: { isActive: boolean }) => {
        expect(product.isActive).toBe(true);
      });
    }
  });

  test('상품 목록 조회 - 페이지네이션 테스트', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/admin/products?limit=10&offset=0`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.data.limit).toBe(10);
    expect(data.data.offset).toBe(0);
    expect(data.data.items.length).toBeLessThanOrEqual(10);
  });

  test('상품 등록 API 테스트', async ({ request }) => {
    const createProductData = {
      name: `테스트 상품 ${Date.now()}`,
      price: 10000,
      description: 'E2E 테스트용 상품입니다',
      thumbnailUrl: null,
      categoryId: null,
      isActive: true,
      productType: 'TIME_CAPSULE',
      mediaTypes: ['TEXT'],
      maxMediaCount: 3,
    };

    const response = await request.post(`${API_BASE_URL}/api/admin/products`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: createProductData,
    });

    if (!response.ok()) {
      const errorBody = await response.text();
      console.error('상품 등록 실패:', {
        status: response.status(),
        statusText: response.statusText(),
        body: errorBody.substring(0, 500),
        requestData: createProductData,
      });
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 응답 구조 검증
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('name');
    expect(data.data).toHaveProperty('price');
    expect(data.data).toHaveProperty('productType');
    expect(data.data).toHaveProperty('mediaTypes');
    expect(data.data).toHaveProperty('maxMediaCount');
    expect(data.data).toHaveProperty('isActive');
    expect(data.data).toHaveProperty('createdAt');
    
    // 생성된 상품 ID 저장 (이후 테스트에서 사용)
    createdProductId = data.data.id;
    expect(createdProductId).toBeTruthy();
    
    // 생성된 데이터 검증
    expect(data.data.name).toBe(createProductData.name);
    expect(data.data.price).toBe(createProductData.price);
    expect(data.data.description).toBe(createProductData.description);
    expect(data.data.productType).toBe(createProductData.productType);
    expect(data.data.mediaTypes).toEqual(createProductData.mediaTypes);
    expect(data.data.maxMediaCount).toBe(createProductData.maxMediaCount);
    expect(data.data.isActive).toBe(createProductData.isActive);
  });

  test('상품 상세 조회 API 테스트', async ({ request }) => {
    // POST로 생성된 상품이 없으면 테스트 스킵
    if (!createdProductId) {
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE_URL}/api/admin/products/${createdProductId}`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 응답 구조 검증
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('name');
    expect(data.data).toHaveProperty('price');
    expect(data.data).toHaveProperty('productType');
    expect(data.data).toHaveProperty('mediaTypes');
    expect(data.data).toHaveProperty('maxMediaCount');
    expect(data.data).toHaveProperty('isActive');
    expect(data.data).toHaveProperty('createdAt');
    expect(data.data.id).toBe(createdProductId);
  });

  test('상품 정보 수정 API 테스트', async ({ request }) => {
    // POST로 생성된 상품이 없으면 테스트 스킵
    if (!createdProductId) {
      test.skip();
      return;
    }

    const updateData = {
      name: `수정된 상품명 ${Date.now()}`,
      price: 15000,
      description: '수정된 설명입니다',
      isActive: false,
    };

    const response = await request.patch(
      `${API_BASE_URL}/api/admin/products/${createdProductId}`,
      {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
          'Content-Type': 'application/json',
        },
        data: updateData,
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 응답 구조 검증
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data.data.id).toBe(createdProductId);
    
    // 수정된 데이터 검증
    expect(data.data.name).toBe(updateData.name);
    expect(data.data.price).toBe(updateData.price);
    expect(data.data.description).toBe(updateData.description);
    expect(data.data.isActive).toBe(updateData.isActive);
  });

  test('상품 삭제 API 테스트 (Soft Delete)', async ({ request }) => {
    // POST로 생성된 상품이 없으면 테스트 스킵
    if (!createdProductId) {
      test.skip();
      return;
    }

    const response = await request.delete(
      `${API_BASE_URL}/api/admin/products/${createdProductId}`,
      {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      }
    );

    // 삭제 성공 응답 검증
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    
    // 삭제 후 상품 조회 시도 (Soft Delete이므로 404가 나올 수 있음)
    const getResponse = await request.get(
      `${API_BASE_URL}/api/admin/products/${createdProductId}`,
      {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      }
    );
    
    // 삭제된 상품은 조회 불가능하거나 DELETED 상태일 수 있음
    expect([200, 404]).toContain(getResponse.status());
  });
});
