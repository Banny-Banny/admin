import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://be-production-8aa2.up.railway.app';

// 테스트용 관리자 계정
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'password123',
};

let adminAccessToken: string;

test.describe('문의하기 API E2E 테스트', () => {
  // 로그인하여 토큰 획득
  test.beforeAll(async ({ request }) => {
    const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
      data: {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    adminAccessToken = loginData.accessToken;
    expect(adminAccessToken).toBeTruthy();
  });

  test('문의 목록 조회 API 테스트', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/admin/inquiries`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 응답 구조 검증
    expect(data).toHaveProperty('inquiries');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('limit');
    expect(data).toHaveProperty('offset');
    expect(Array.isArray(data.inquiries)).toBeTruthy();
  });

  test('문의 목록 조회 - 상태 필터 테스트', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/admin/inquiries?status=PENDING`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 모든 문의가 PENDING 상태인지 확인
    if (data.inquiries.length > 0) {
      data.inquiries.forEach((inquiry: { status: string }) => {
        expect(inquiry.status).toBe('PENDING');
      });
    }
  });

  test('문의 목록 조회 - 페이지네이션 테스트', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/admin/inquiries?limit=10&offset=0`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.limit).toBe(10);
    expect(data.offset).toBe(0);
    expect(data.inquiries.length).toBeLessThanOrEqual(10);
  });

  test('문의 상세 조회 API 테스트', async ({ request }) => {
    // 먼저 문의 목록을 가져와서 첫 번째 문의 ID 사용
    const listResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries?limit=1`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(listResponse.ok()).toBeTruthy();
    const listData = await listResponse.json();

    if (listData.inquiries.length === 0) {
      test.skip();
      return;
    }

    const inquiryId = listData.inquiries[0].id;

    // 문의 상세 조회
    const detailResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries/${inquiryId}`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(detailResponse.ok()).toBeTruthy();
    const detailData = await detailResponse.json();

    // 응답 구조 검증
    expect(detailData).toHaveProperty('inquiry');
    expect(detailData).toHaveProperty('messages');
    expect(detailData).toHaveProperty('total');
    expect(detailData).toHaveProperty('limit');
    expect(detailData).toHaveProperty('offset');
    expect(detailData.inquiry.id).toBe(inquiryId);
    expect(Array.isArray(detailData.messages)).toBeTruthy();
  });

  test('문의 상태 변경 API 테스트', async ({ request }) => {
    // 먼저 문의 목록을 가져와서 첫 번째 문의 ID 사용
    const listResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries?limit=1`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(listResponse.ok()).toBeTruthy();
    const listData = await listResponse.json();

    if (listData.inquiries.length === 0) {
      test.skip();
      return;
    }

    const inquiryId = listData.inquiries[0].id;

    // 상태 변경
    const updateResponse = await request.patch(
      `${API_BASE_URL}/api/admin/inquiries/${inquiryId}/status`,
      {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          status: 'PROCESSING',
        },
      }
    );

    expect(updateResponse.ok()).toBeTruthy();
    const updateData = await updateResponse.json();
    expect(updateData.status).toBe('PROCESSING');
  });

  test('문의방 삭제 API 테스트', async ({ request }) => {
    // 먼저 문의 목록을 가져와서 첫 번째 문의 ID 사용
    const listResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries?limit=1`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(listResponse.ok()).toBeTruthy();
    const listData = await listResponse.json();

    if (listData.inquiries.length === 0) {
      test.skip();
      return;
    }

    const inquiryId = listData.inquiries[0].id;

    // 문의방 삭제
    const deleteResponse = await request.delete(
      `${API_BASE_URL}/api/admin/inquiries/${inquiryId}`,
      {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      }
    );

    // 삭제 성공 또는 404 (이미 삭제됨) 허용
    expect([200, 204, 404]).toContain(deleteResponse.status());
  });

  test('문의 메시지 수정 API 테스트', async ({ request }) => {
    // 먼저 문의 상세를 가져와서 메시지 ID 사용
    const listResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries?limit=1`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(listResponse.ok()).toBeTruthy();
    const listData = await listResponse.json();

    if (listData.inquiries.length === 0) {
      test.skip();
      return;
    }

    const inquiryId = listData.inquiries[0].id;

    // 문의 상세 조회
    const detailResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries/${inquiryId}`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(detailResponse.ok()).toBeTruthy();
    const detailData = await detailResponse.json();

    // 관리자가 보낸 메시지 찾기
    const adminMessage = detailData.messages.find(
      (msg: { senderType: string; senderAdminId: string | null }) =>
        msg.senderType === 'ADMIN' && msg.senderAdminId
    );

    if (!adminMessage) {
      test.skip();
      return;
    }

    // 메시지 수정
    const updateResponse = await request.put(
      `${API_BASE_URL}/api/admin/inquiries/${inquiryId}/messages/${adminMessage.id}`,
      {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          content: '수정된 메시지 내용',
        },
      }
    );

    expect(updateResponse.ok()).toBeTruthy();
    const updateData = await updateResponse.json();
    expect(updateData.content).toBe('수정된 메시지 내용');
  });

  test('문의 메시지 삭제 API 테스트', async ({ request }) => {
    // 먼저 문의 상세를 가져와서 메시지 ID 사용
    const listResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries?limit=1`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(listResponse.ok()).toBeTruthy();
    const listData = await listResponse.json();

    if (listData.inquiries.length === 0) {
      test.skip();
      return;
    }

    const inquiryId = listData.inquiries[0].id;

    // 문의 상세 조회
    const detailResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries/${inquiryId}`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(detailResponse.ok()).toBeTruthy();
    const detailData = await detailResponse.json();

    // 관리자가 보낸 메시지 찾기
    const adminMessage = detailData.messages.find(
      (msg: { senderType: string; senderAdminId: string | null }) =>
        msg.senderType === 'ADMIN' && msg.senderAdminId
    );

    if (!adminMessage) {
      test.skip();
      return;
    }

    // 메시지 삭제
    const deleteResponse = await request.delete(
      `${API_BASE_URL}/api/admin/inquiries/${inquiryId}/messages/${adminMessage.id}`,
      {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      }
    );

    // 삭제 성공 또는 404 (이미 삭제됨) 허용
    expect([200, 204, 404]).toContain(deleteResponse.status());
  });
});
