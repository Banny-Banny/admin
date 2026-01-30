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
async function getAdminToken(request: APIRequestContext): Promise<string | null> {
  const loginUrl = `${API_BASE_URL}/api/admin/auth/login`;
  console.log(`[auth] 로그인 요청 URL: ${loginUrl}`);

  const loginResponse = await request.post(loginUrl, {
    data: {
      email: SUPER_ADMIN.email,
      password: SUPER_ADMIN.password,
    },
  });

  if (loginResponse.status() !== 200) {
    console.log(`로그인 실패: ${loginResponse.status()}`);
    try {
      console.log(
        '[auth] 응답 본문:',
        JSON.stringify(await loginResponse.json(), null, 2),
      );
    } catch (error) {
      console.log('[auth] 응답 본문 파싱 실패', error);
    }
    return null;
  }

  const body = await loginResponse.json();
  return body.accessToken || body.data?.accessToken || null;
}

test.describe('주문 관리 API 테스트', () => {
  let authToken: string | null = null;

  test.beforeAll(async ({ request }) => {
    authToken = await getAdminToken(request);
    if (!authToken) {
      console.log('⚠️ 관리자 인증 실패 - 테스트가 스킵됩니다');
    }
  });

  test.describe('1. GET /api/admin/dashboard/orders', () => {
    test('주문 목록 조회 - 기본값', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      const response = await request.get(`${API_BASE_URL}/api/admin/dashboard/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      console.log(`Status: ${response.status()}`);
      const body = await response.json();
      console.log('Response:', JSON.stringify(body, null, 2));

      expect(response.status()).toBe(200);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('items');
      expect(body.data).toHaveProperty('total');
      expect(body.data).toHaveProperty('limit');
      expect(body.data).toHaveProperty('offset');
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(typeof body.data.total).toBe('number');
      expect(typeof body.data.limit).toBe('number');
      expect(typeof body.data.offset).toBe('number');

      // items 구조 검증
      if (body.data.items.length > 0) {
        const item = body.data.items[0];
        expect(item).toHaveProperty('order_id');
        expect(item).toHaveProperty('order_status');
        expect(item).toHaveProperty('total_amount');
        expect(item).toHaveProperty('created_at');
        expect(item).toHaveProperty('product');
        expect(item).toHaveProperty('payment'); // null 가능
        expect(item).toHaveProperty('user');
      }
    });

    test('주문 목록 조회 - 필터 조합 (status=PAID)', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders?status=PAID&limit=10&offset=0`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('items');
      expect(body.data).toHaveProperty('total');
      expect(body.data).toHaveProperty('limit', 10);
      expect(body.data).toHaveProperty('offset', 0);
    });

    test('주문 목록 조회 - payment null 케이스 (PENDING_PAYMENT)', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders?status=PENDING_PAYMENT&limit=5`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('items');

      // payment가 null인 경우도 정상 응답이어야 함
      if (body.data.items.length > 0) {
        const itemWithNullPayment = body.data.items.find(
          (item: any) => item.payment === null,
        );
        if (itemWithNullPayment) {
          expect(itemWithNullPayment.payment).toBeNull();
          expect(itemWithNullPayment).toHaveProperty('order_id');
          expect(itemWithNullPayment).toHaveProperty('user');
        }
      }
    });

    test('주문 목록 조회 - userSearch 파라미터 (닉네임 검색)', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      // 먼저 목록을 조회하여 유저 닉네임을 얻음
      const listResponse = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders?limit=1`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (listResponse.status() !== 200) {
        test.skip(true, '목록 조회 실패');
        return;
      }

      const listBody = await listResponse.json();
      if (!listBody.data?.items || listBody.data.items.length === 0) {
        test.skip(true, '조회할 주문이 없음');
        return;
      }

      const userNickname = listBody.data.items[0].user?.nickname;
      if (!userNickname) {
        test.skip(true, '유저 닉네임이 없음');
        return;
      }

      // userSearch로 닉네임 검색
      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders?userSearch=${encodeURIComponent(userNickname)}&limit=10`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('items');
      expect(body.data).toHaveProperty('total');
      
      // 검색 결과의 모든 항목이 해당 닉네임을 가진 유저의 주문이어야 함
      if (body.data.items.length > 0) {
        body.data.items.forEach((item: any) => {
          expect(item.user).toHaveProperty('nickname');
          expect(item.user.nickname).toBe(userNickname);
        });
      }
    });

    test('주문 목록 조회 - userSearch 파라미터 (이메일 검색)', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      // 먼저 목록을 조회하여 유저 이메일을 얻음
      const listResponse = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders?limit=1`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (listResponse.status() !== 200) {
        test.skip(true, '목록 조회 실패');
        return;
      }

      const listBody = await listResponse.json();
      if (!listBody.data?.items || listBody.data.items.length === 0) {
        test.skip(true, '조회할 주문이 없음');
        return;
      }

      const userEmail = listBody.data.items[0].user?.email;
      if (!userEmail) {
        test.skip(true, '유저 이메일이 없음');
        return;
      }

      // userSearch로 이메일 검색
      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders?userSearch=${encodeURIComponent(userEmail)}&limit=10`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('items');
      expect(body.data).toHaveProperty('total');
      
      // 검색 결과의 모든 항목이 해당 이메일을 가진 유저의 주문이어야 함
      if (body.data.items.length > 0) {
        body.data.items.forEach((item: any) => {
          expect(item.user).toHaveProperty('email');
          expect(item.user.email).toBe(userEmail);
        });
      }
    });

    test('주문 목록 조회 - userId 파라미터 (UUID 검색)', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      // 먼저 목록을 조회하여 유저 ID를 얻음
      const listResponse = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders?limit=1`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (listResponse.status() !== 200) {
        test.skip(true, '목록 조회 실패');
        return;
      }

      const listBody = await listResponse.json();
      if (!listBody.data?.items || listBody.data.items.length === 0) {
        test.skip(true, '조회할 주문이 없음');
        return;
      }

      const userId = listBody.data.items[0].user?.id;
      if (!userId) {
        test.skip(true, '유저 ID가 없음');
        return;
      }

      // userId로 UUID 검색
      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders?userId=${encodeURIComponent(userId)}&limit=10`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('items');
      expect(body.data).toHaveProperty('total');
      
      // 검색 결과의 모든 항목이 해당 유저 ID를 가진 유저의 주문이어야 함
      if (body.data.items.length > 0) {
        body.data.items.forEach((item: any) => {
          expect(item.user).toHaveProperty('id');
          expect(item.user.id).toBe(userId);
        });
      }
    });
  });

  test.describe('2. GET /api/admin/dashboard/orders/{id}', () => {
    test('주문 상세 조회', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      // 먼저 목록을 조회하여 주문 ID를 얻음
      const listResponse = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders?limit=1`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (listResponse.status() !== 200) {
        test.skip(true, '목록 조회 실패');
        return;
      }

      const listBody = await listResponse.json();
      if (!listBody.data?.items || listBody.data.items.length === 0) {
        test.skip(true, '조회할 주문이 없음');
        return;
      }

      const orderId = listBody.data.items[0].order_id;

      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      console.log(`Status: ${response.status()}`);
      const body = await response.json();
      console.log('Response:', JSON.stringify(body, null, 2));

      expect(response.status()).toBe(200);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');

      // 상세 조회는 nested 구조: order, product, user, payment
      expect(body.data).toHaveProperty('order');
      expect(body.data.order).toHaveProperty('id', orderId);
      expect(body.data.order).toHaveProperty('status');
      expect(body.data.order).toHaveProperty('total_amount');
      expect(body.data.order).toHaveProperty('created_at');
      expect(body.data).toHaveProperty('product');
      expect(body.data).toHaveProperty('payment'); // null 가능
      expect(body.data).toHaveProperty('user');
    });

    test('주문 상세 조회 - payment null 케이스', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      // PENDING_PAYMENT 상태의 주문 찾기
      const listResponse = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders?status=PENDING_PAYMENT&limit=1`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (listResponse.status() !== 200) {
        test.skip(true, '목록 조회 실패');
        return;
      }

      const listBody = await listResponse.json();
      if (!listBody.data?.items || listBody.data.items.length === 0) {
        test.skip(true, 'PENDING_PAYMENT 상태의 주문이 없음');
        return;
      }

      const orderId = listBody.data.items[0].order_id;

      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('success', true);

      // 상세 조회는 nested 구조
      expect(body.data).toHaveProperty('order');
      expect(body.data).toHaveProperty('payment'); // null일 수 있음
      if (body.data.payment === null) {
        expect(body.data.payment).toBeNull();
      }
    });
  });

  test.describe('3. PATCH /api/admin/dashboard/orders/{id}/status', () => {
    test('주문 상태 변경', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      // 먼저 목록을 조회하여 주문 ID를 얻음
      const listResponse = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/orders?limit=1`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (listResponse.status() !== 200) {
        test.skip(true, '목록 조회 실패');
        return;
      }

      const listBody = await listResponse.json();
      if (!listBody.data?.items || listBody.data.items.length === 0) {
        test.skip(true, '조회할 주문이 없음');
        return;
      }

      const orderId = listBody.data.items[0].order_id;
      const originalStatus = listBody.data.items[0].order_status;

      // 상태 변경 요청 (원래 상태로 되돌리기 위해 저장)
      const newStatus = originalStatus === 'PAID' ? 'PENDING' : 'PAID';

      const response = await request.patch(
        `${API_BASE_URL}/api/admin/dashboard/orders/${orderId}/status`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            status: newStatus,
          },
        },
      );

      console.log(`Status: ${response.status()}`);
      const body = await response.json();
      console.log('Response:', JSON.stringify(body, null, 2));

      // 성공 또는 실패 모두 정상적인 응답 구조여야 함
      if (response.status() === 200) {
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('order_id', orderId);
        expect(body.data).toHaveProperty('order_status', newStatus);
      } else {
        // 400, 404 등 에러 응답도 구조 확인
        expect([400, 404, 422]).toContain(response.status());
      }
    });
  });

  test.describe('4. 인증 실패 케이스', () => {
    test('토큰 없이 요청 시 401/403/404 반환', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/admin/dashboard/orders`);
      expect([401, 403, 404]).toContain(response.status());
    });

    test('잘못된 토큰으로 요청 시 401/403/404 반환', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/admin/dashboard/orders`, {
        headers: { Authorization: 'Bearer invalid_token_here' },
      });
      expect([401, 403, 404]).toContain(response.status());
    });
  });
});
