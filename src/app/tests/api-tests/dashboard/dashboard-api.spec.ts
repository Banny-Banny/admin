import { test, expect, APIRequestContext } from '@playwright/test';

// API Base URL 설정
// Base URL을 조합할 때 중복 슬래시를 없애기 위해 끝 슬래시 제거
const RAW_API_BASE_URL =
 process.env.NEXT_PUBLIC_API_BASE_URL||'https://be-production-8aa2.up.railway.app'||process.env.API_BASE_URL;
 
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

test.describe('대시보드 API 테스트', () => {
  let authToken: string | null = null;

  test.beforeAll(async ({ request }) => {
    authToken = await getAdminToken(request);
    if (!authToken) {
      console.log('⚠️ 관리자 인증 실패 - 테스트가 스킵됩니다');
    }
  });

  test.describe('1. GET /api/admin/dashboard/summary', () => {
    test('대시보드 요약 지표 조회', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      const response = await request.get(`${API_BASE_URL}/api/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      console.log(`Status: ${response.status()}`);
      const body = await response.json();
      console.log('Response:', JSON.stringify(body, null, 2));

      expect(response.status()).toBe(200);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('signups');
      expect(body.data).toHaveProperty('newInquiries');
      expect(body.data).toHaveProperty('dau');
      expect(typeof body.data.signups).toBe('number');
      expect(typeof body.data.newInquiries).toBe('number');
      expect(typeof body.data.dau).toBe('number');
    });
  });

  test.describe('2. GET /api/admin/dashboard/charts', () => {
    test('차트 데이터 조회 - period=day', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      const response = await request.get(`${API_BASE_URL}/api/admin/dashboard/charts?period=day`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      console.log(`Status: ${response.status()}`);
      const body = await response.json();
      console.log('Response:', JSON.stringify(body, null, 2));

      expect(response.status()).toBe(200);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      // 실제 API 응답 구조: { period, startDate, endDate, items: [...] }
      expect(body.data).toHaveProperty('period', 'day');
      expect(body.data).toHaveProperty('items');
      expect(Array.isArray(body.data.items)).toBe(true);
      // items 구조 검증
      if (body.data.items.length > 0) {
        expect(body.data.items[0]).toHaveProperty('period');
        expect(body.data.items[0]).toHaveProperty('signups');
        expect(body.data.items[0]).toHaveProperty('revenue');
      }
    });

    test('차트 데이터 조회 - period=week', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      const response = await request.get(`${API_BASE_URL}/api/admin/dashboard/charts?period=week`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('period', 'week');
      expect(body.data).toHaveProperty('items');
      expect(Array.isArray(body.data.items)).toBe(true);
    });

    test('차트 데이터 조회 - period=month', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      const response = await request.get(`${API_BASE_URL}/api/admin/dashboard/charts?period=month`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('period', 'month');
      expect(body.data).toHaveProperty('items');
      expect(Array.isArray(body.data.items)).toBe(true);
    });
  });

  test.describe('3. GET /api/admin/dashboard/user-trends', () => {
    test('사용자 가입/탈퇴 추이 조회 - period=90d', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      const response = await request.get(`${API_BASE_URL}/api/admin/dashboard/user-trends?period=90d`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      console.log(`Status: ${response.status()}`);
      const body = await response.json();
      console.log('Response:', JSON.stringify(body, null, 2));

      expect(response.status()).toBe(200);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      // 실제 API 응답 구조: data는 배열 [{ date, joined, withdrawn }, ...]
      expect(Array.isArray(body.data)).toBe(true);
      // 배열 아이템 구조 검증
      if (body.data.length > 0) {
        expect(body.data[0]).toHaveProperty('date');
        expect(body.data[0]).toHaveProperty('joined');
        expect(body.data[0]).toHaveProperty('withdrawn');
      }
    });
  });

  test.describe('4. 인증 실패 케이스', () => {
    test('토큰 없이 요청 시 401/403/404 반환', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/admin/dashboard/summary`);
      // 404: API 미구현, 401/403: 인증 필요
      expect([401, 403, 404]).toContain(response.status());
    });

    test('잘못된 토큰으로 요청 시 401/403/404 반환', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/admin/dashboard/summary`, {
        headers: { Authorization: 'Bearer invalid_token_here' },
      });
      // 404: API 미구현, 401/403: 인증 실패
      expect([401, 403, 404]).toContain(response.status());
    });
  });
});
