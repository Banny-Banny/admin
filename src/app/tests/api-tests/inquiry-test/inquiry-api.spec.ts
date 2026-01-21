import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 직접 로드 (Playwright 워커 프로세스에서도 동작하도록)
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
// API_BASE_URL은 절대 URL로 사용해야 함 (Playwright request는 baseURL을 사용하지 않음)
// 테스트에서는 프로덕션 서버(NEXT_PUBLIC_API_BASE_URL)를 우선 사용, 없으면 API_BASE_URL, 마지막으로 기본값
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://be-production-8aa2.up.railway.app').replace(/\/$/, '');

// 테스트용 관리자 계정 (.env 파일에서 읽어옴)
const TEST_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.SUPER_ADMIN_PASSWORD || 'password123',
};

let adminAccessToken: string;

test.describe('문의하기 API E2E 테스트', () => {
  // 로그인하여 토큰 획득
  test.beforeAll(async ({ request }) => {
    // 환경 변수 확인 (디버깅용)
    if (!TEST_ADMIN.email || !TEST_ADMIN.password) {
      console.error('환경 변수가 설정되지 않았습니다:', {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password ? '***' : undefined,
        envEmail: process.env.SUPER_ADMIN_EMAIL,
        envPassword: process.env.SUPER_ADMIN_PASSWORD ? '***' : undefined,
      });
    }

    // API_BASE_URL 확인
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('로그인 요청 URL:', `${API_BASE_URL}/api/admin/auth/login`);

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

  test('문의 목록 조회 API 테스트', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/admin/inquiries`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 응답 구조 검증 (실제 API 응답 구조에 맞게 수정)
    // 실제 응답: {"success": true, "data": {"items": [...], "limit": 10, "offset": 0, "total": 1}}
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
      expect(item).toHaveProperty('user');
      expect(item.user).toHaveProperty('id');
      expect(item.user).toHaveProperty('nickname');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('isResolved');
      expect(item).toHaveProperty('lastMessageAt');
      expect(item).toHaveProperty('lastMessagePreview');
      expect(item).toHaveProperty('unreadCount');
      expect(item).toHaveProperty('createdAt');
    }
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
    if (data.data.items.length > 0) {
      data.data.items.forEach((inquiry: { status: string }) => {
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
    
    expect(data.data.limit).toBe(10);
    expect(data.data.offset).toBe(0);
    expect(data.data.items.length).toBeLessThanOrEqual(10);
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

    if (listData.data.items.length === 0) {
      test.skip();
      return;
    }

    const inquiryId = listData.data.items[0].id;

    // 문의 상세 조회
    const detailResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries/${inquiryId}`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(detailResponse.ok()).toBeTruthy();
    const detailData = await detailResponse.json();

    // 응답 구조 검증 (실제 API 응답 구조에 맞게 수정)
    // 실제 응답 구조: {"success": true, "data": {"inquiry": {...}, "messages": [...], "total": ..., "limit": ..., "offset": ...}}
    expect(detailData).toHaveProperty('success');
    expect(detailData).toHaveProperty('data');
    expect(detailData.data).toHaveProperty('inquiry');
    expect(detailData.data).toHaveProperty('messages');
    expect(detailData.data).toHaveProperty('total');
    expect(detailData.data).toHaveProperty('limit');
    expect(detailData.data).toHaveProperty('offset');
    expect(detailData.data.inquiry.id).toBe(inquiryId);
    expect(Array.isArray(detailData.data.messages)).toBeTruthy();
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

    if (listData.data.items.length === 0) {
      test.skip();
      return;
    }

    const inquiryId = listData.data.items[0].id;

    // 상태 변경
    const updateResponse = await request.patch(
      `${API_BASE_URL}/api/admin/inquiries/${inquiryId}/status`,
      {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          status: 'IN_PROGRESS',
        },
      }
    );

    expect(updateResponse.ok()).toBeTruthy();
    const updateData = await updateResponse.json();
    // 응답 구조에 따라 수정 필요할 수 있음
    expect(updateData.data?.status || updateData.status).toBe('IN_PROGRESS');
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

    if (listData.data.items.length === 0) {
      test.skip();
      return;
    }

    const inquiryId = listData.data.items[0].id;

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

    if (listData.data.items.length === 0) {
      test.skip();
      return;
    }

    const inquiryId = listData.data.items[0].id;

    // 문의 상세 조회
    const detailResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries/${inquiryId}`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(detailResponse.ok()).toBeTruthy();
    const detailData = await detailResponse.json();

    // 관리자가 보낸 메시지 찾기
    const adminMessage = detailData.data.messages.find(
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
    // 응답 구조에 따라 수정 필요할 수 있음
    expect(updateData.data?.content || updateData.content).toBe('수정된 메시지 내용');
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

    if (listData.data.items.length === 0) {
      test.skip();
      return;
    }

    const inquiryId = listData.data.items[0].id;

    // 문의 상세 조회
    const detailResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries/${inquiryId}`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    expect(detailResponse.ok()).toBeTruthy();
    const detailData = await detailResponse.json();

    // 관리자가 보낸 메시지 찾기
    const adminMessage = detailData.data.messages.find(
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
