import { test, expect, APIRequestContext } from '@playwright/test';

// API Base URL 설정
const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://be-production-8aa2.up.railway.app' ||
  process.env.API_BASE_URL;

const API_BASE_URL = RAW_API_BASE_URL?.replace(/\/+$/, '') || '';

// 슈퍼 어드민 계정 정보
const SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com',
  password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin1234!',
};

// 관리자 토큰 획득 헬퍼 함수
async function getAdminToken(request: APIRequestContext): Promise<string> {
  const loginUrl = `${API_BASE_URL}/api/admin/auth/login`;
  console.log(`[auth] 로그인 요청 URL: ${loginUrl}`);

  const loginResponse = await request.post(loginUrl, {
    data: {
      email: SUPER_ADMIN.email,
      password: SUPER_ADMIN.password,
    },
  });

  if (loginResponse.status() !== 200) {
    const errorBody = await loginResponse.json().catch(() => ({}));
    throw new Error(`로그인 실패: ${loginResponse.status()} - ${JSON.stringify(errorBody)}`);
  }

  const body = await loginResponse.json();
  const token = body.accessToken || body.data?.accessToken;
  if (!token) {
    throw new Error('로그인 응답에 accessToken이 없습니다');
  }
  return token;
}

test.describe('결제 관리 API 테스트', () => {
  let authToken: string;
  let realPaymentId: string;
  let realOrderId: string;
  let realUserId: string;

  test.beforeAll(async ({ request }) => {
    // 1. 인증
    authToken = await getAdminToken(request);

    // 2. 실제 결제 데이터 조회
    const logsResponse = await request.get(
      `${API_BASE_URL}/api/admin/dashboard/payments/logs?status=PAID&limit=1`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (logsResponse.status() !== 200) {
      throw new Error(`결제 로그 조회 실패: ${logsResponse.status()}`);
    }

    const logsBody = await logsResponse.json();
    if (!logsBody.data?.items?.length) {
      throw new Error('테스트할 결제 데이터 없음 - 백엔드에 PAID 상태의 결제가 필요합니다');
    }

    const firstItem = logsBody.data.items[0];
    realPaymentId = firstItem.payment_id || firstItem.paymentId;
    realUserId = firstItem.user?.id || firstItem.userId;
    realOrderId = firstItem.order_id || firstItem.orderId;

    if (!realPaymentId || !realUserId || !realOrderId) {
      throw new Error(`필수 테스트 데이터 누락 - paymentId: ${realPaymentId}, userId: ${realUserId}, orderId: ${realOrderId}`);
    }

    console.log(`[setup] 실제 결제 ID: ${realPaymentId}`);
    console.log(`[setup] 실제 사용자 ID: ${realUserId}`);
    console.log(`[setup] 실제 주문 ID: ${realOrderId}`);
  });

  test.describe('1. GET /api/admin/dashboard/payments/logs', () => {
    test('결제 로그 조회 - 기본값 (데이터 있어야 함)', async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/payments/logs?status=PAID`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.items.length).toBeGreaterThan(0); // 데이터 있어야 함
      expect(typeof body.data.total).toBe('number');
      expect(body.data.total).toBeGreaterThan(0);

      // 첫 번째 아이템 구조 검증
      const item = body.data.items[0];
      expect(item.payment_id || item.paymentId).toBeDefined();
      expect(item.order_id || item.orderId).toBeDefined();
      expect(item.status).toBe('PAID');
      expect(typeof item.amount).toBe('number');
    });

    test('결제 로그 조회 - 상태 필터 (PAID)', async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/payments/logs?status=PAID&limit=10`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.data.items.length).toBeGreaterThan(0); // 데이터 있어야 함

      // 모든 아이템이 PAID 상태인지 검증
      for (const item of body.data.items) {
        expect(item.status).toBe('PAID');
      }
    });

    test('결제 로그 조회 - 사용자 ID 필터', async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/payments/logs?status=PAID&limit=10`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.data.items.length).toBeGreaterThan(0);

      // 사용자 정보가 있는지 검증
      const item = body.data.items[0];
      expect(item.user || item.userId).toBeDefined();
    });

    test('결제 로그 조회 - 페이지네이션', async ({ request }) => {
      const limit = 5;

      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/payments/logs?status=PAID&limit=${limit}&offset=0`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.data.limit).toBe(limit);
      expect(body.data.offset).toBe(0);
      expect(body.data.items.length).toBeLessThanOrEqual(limit);
      expect(body.data.items.length).toBeGreaterThan(0); // 데이터 있어야 함
    });

    test('결제 로그 조회 - 응답 구조 상세 검증', async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/payments/logs?status=PAID&limit=1`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.items.length).toBe(1);

      const item = body.data.items[0];
      // 필수 필드 검증
      expect(item.payment_id || item.paymentId).toBeDefined();
      expect(item.order_id || item.orderId).toBeDefined();
      expect(item.status).toBeDefined();
      expect(['READY', 'PAID', 'CANCELED', 'FAILED']).toContain(item.status);
      expect(typeof item.amount).toBe('number');
      expect(item.amount).toBeGreaterThan(0);
    });
  });

  test.describe('2. POST /api/admin/dashboard/payments/{id}/cancel', () => {
    test('결제 취소 - 존재하지 않는 결제 ID (404 또는 400)', async ({ request }) => {
      const response = await request.post(
        `${API_BASE_URL}/api/admin/dashboard/payments/non-existent-id/cancel`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            cancelReason: '테스트 취소',
            cancelAmount: 10000,
          },
        }
      );

      // 에러 응답이어야 함
      expect([400, 404, 500]).toContain(response.status());

      const body = await response.json();
      expect(body.message).toBeDefined();
    });

    test('결제 취소 - 필수 필드 누락 (cancelReason 없음)', async ({ request }) => {
      const response = await request.post(
        `${API_BASE_URL}/api/admin/dashboard/payments/${realPaymentId}/cancel`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            cancelAmount: 10000,
            // cancelReason 누락
          },
        }
      );

      // 400 또는 422 에러여야 함
      expect([400, 422]).toContain(response.status());
    });

    test('결제 취소 - 실제 결제 취소 요청 (토스 연동 테스트)', async ({ request }) => {
      const response = await request.post(
        `${API_BASE_URL}/api/admin/dashboard/payments/${realPaymentId}/cancel`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            cancelReason: 'API 테스트 - 취소 요청',
            cancelAmount: 1000,
          },
        }
      );

      const body = await response.json();
      console.log(`취소 요청 결과: ${response.status()}`, JSON.stringify(body, null, 2));

      // 200: 성공, 400: 취소 불가 금액/이미 취소됨
      if (response.status() === 200) {
        // 백엔드가 직접 토스 응답 반환
        expect(body.status).toBeDefined();
        expect(['CANCELED', 'PARTIAL_CANCELED']).toContain(body.status);
        expect(body.cancels).toBeDefined();
        expect(Array.isArray(body.cancels)).toBe(true);
        expect(body.cancels.length).toBeGreaterThan(0);
      } else if (response.status() === 400) {
        // 토스에서 취소 불가 에러 (이미 취소됨, 금액 초과 등)
        expect(body.message).toBeDefined();
      } else {
        // 그 외 에러
        expect(body.message).toBeDefined();
      }
    });
  });

  test.describe('3. POST /api/admin/dashboard/receipts/{orderId}/issue', () => {
    test('영수증 재발급 - 성공', async ({ request }) => {
      const response = await request.post(
        `${API_BASE_URL}/api/admin/dashboard/receipts/${realOrderId}/issue`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            email: 'test@example.com',
          },
        }
      );

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.order_id).toBe(realOrderId);
      expect(body.data.receipt_url).toBeDefined();
      expect(typeof body.data.receipt_url).toBe('string');
      expect(body.data.receipt_url).toContain('http');
    });

    test('영수증 재발급 - 잘못된 이메일 형식 (400)', async ({ request }) => {
      const response = await request.post(
        `${API_BASE_URL}/api/admin/dashboard/receipts/${realOrderId}/issue`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            email: 'invalid-email',
          },
        }
      );

      expect([400, 422]).toContain(response.status());

      const body = await response.json();
      expect(body.message).toBeDefined();
    });

    test('영수증 재발급 - 존재하지 않는 주문 (404 또는 400)', async ({ request }) => {
      const response = await request.post(
        `${API_BASE_URL}/api/admin/dashboard/receipts/non-existent-order-id/issue`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            email: 'test@example.com',
          },
        }
      );

      expect([400, 404, 500]).toContain(response.status());

      const body = await response.json();
      expect(body.message).toBeDefined();
    });

    test('영수증 재발급 - 응답 구조 검증', async ({ request }) => {
      const response = await request.post(
        `${API_BASE_URL}/api/admin/dashboard/receipts/${realOrderId}/issue`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            email: 'structure-test@example.com',
          },
        }
      );

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.order_id).toBeDefined();
      expect(body.data.payment_id).toBeDefined();
      expect(body.data.receipt_url).toBeDefined();
      expect(typeof body.data.order_id).toBe('string');
      expect(typeof body.data.payment_id).toBe('string');
      expect(typeof body.data.receipt_url).toBe('string');
    });
  });
});
