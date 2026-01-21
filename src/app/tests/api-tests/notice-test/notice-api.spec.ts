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
let createdNoticeId: string | null = null;

test.describe('공지사항 관리 API E2E 테스트', () => {
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

  test.afterAll(async ({ request }) => {
    // 테스트로 생성한 공지사항 삭제
    if (createdNoticeId) {
      await request.delete(`${API_BASE_URL}/api/admin/notices/${createdNoticeId}`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });
    }
  });

  test('공지사항 목록 조회 API 테스트 (공개 API)', async ({ request }) => {
    // 공개 API이므로 인증 토큰 없이 요청
    const response = await request.get(`${API_BASE_URL}/api/notices`);

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
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('imageUrl');
      expect(item).toHaveProperty('isPinned');
      expect(item).toHaveProperty('createdAt');
    }
  });

  test('공지사항 목록 조회 - 검색 필터 테스트 (공개 API)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/notices?search=시스템`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data.items)).toBeTruthy();
  });

  test('공지사항 목록 조회 - 페이지네이션 테스트 (공개 API)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/notices?limit=10&offset=0`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.data.limit).toBe(10);
    expect(data.data.offset).toBe(0);
    expect(data.data.items.length).toBeLessThanOrEqual(10);
  });

  test('공지사항 상세 조회 API 테스트 (공개 API)', async ({ request }) => {
    // 먼저 공지사항 목록을 조회하여 ID 획득
    const listResponse = await request.get(`${API_BASE_URL}/api/notices`);
    const listData = await listResponse.json();
    const noticeId = listData.data.items[0]?.id;
    
    if (!noticeId) {
      test.skip();
      return;
    }

    // 공개 API이므로 인증 토큰 없이 요청
    const response = await request.get(`${API_BASE_URL}/api/notices/${noticeId}`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 응답 구조 검증
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('title');
    expect(data.data).toHaveProperty('content');
    expect(data.data).toHaveProperty('imageUrl');
    expect(data.data).toHaveProperty('isPinned');
    expect(data.data).toHaveProperty('createdAt');
    expect(data.data.id).toBe(noticeId);
  });

  test('공지사항 등록 API 테스트 (관리자 API)', async ({ request }) => {
    const createNoticeData = {
      title: `테스트 공지사항 ${Date.now()}`,
      content: 'E2E 테스트용 공지사항입니다',
      imageUrl: null,
      isPinned: false,
      isVisible: true,
    };

    const response = await request.post(`${API_BASE_URL}/api/admin/notices`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: createNoticeData,
    });

    if (!response.ok()) {
      const errorBody = await response.text();
      console.error('공지사항 등록 실패:', {
        status: response.status(),
        statusText: response.statusText(),
        body: errorBody.substring(0, 500),
        requestData: createNoticeData,
      });
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 응답 구조 검증
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('title');
    expect(data.data).toHaveProperty('content');
    expect(data.data).toHaveProperty('imageUrl');
    expect(data.data).toHaveProperty('isPinned');
    expect(data.data).toHaveProperty('isVisible');
    expect(data.data).toHaveProperty('createdAt');
    
    // 생성된 공지사항 ID 저장 (이후 테스트에서 사용)
    createdNoticeId = data.data.id;
    expect(createdNoticeId).toBeTruthy();
    
    // 생성된 데이터 검증
    expect(data.data.title).toBe(createNoticeData.title);
    expect(data.data.content).toBe(createNoticeData.content);
    expect(data.data.isPinned).toBe(createNoticeData.isPinned);
    expect(data.data.isVisible).toBe(createNoticeData.isVisible);
  });

  test('공지사항 수정 API 테스트 (관리자 API)', async ({ request }) => {
    // POST로 생성한 데이터가 있을 경우에만 테스트 진행
    if (!createdNoticeId) {
      test.skip();
      return;
    }

    const updateData = {
      title: `수정된 공지사항 제목 ${Date.now()}`,
      isPinned: true,
    };

    const response = await request.patch(
      `${API_BASE_URL}/api/admin/notices/${createdNoticeId}`,
      {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
          'Content-Type': 'application/json',
        },
        data: updateData,
      }
    );

    if (!response.ok()) {
      const errorBody = await response.text();
      console.error('공지사항 수정 실패:', {
        status: response.status(),
        statusText: response.statusText(),
        body: errorBody.substring(0, 500),
        requestData: updateData,
      });
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 응답 구조 검증
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
  });

  test('공지사항 삭제 API 테스트 (관리자 API)', async ({ request }) => {
    // POST로 생성한 데이터가 있을 경우에만 테스트 진행
    if (!createdNoticeId) {
      test.skip();
      return;
    }

    const response = await request.delete(
      `${API_BASE_URL}/api/admin/notices/${createdNoticeId}`,
      {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      }
    );

    if (!response.ok()) {
      const errorBody = await response.text();
      console.error('공지사항 삭제 실패:', {
        status: response.status(),
        statusText: response.statusText(),
        body: errorBody.substring(0, 500),
      });
    }

    // 삭제 성공 응답 검증
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    
    // 삭제 후 공지사항 조회 시도 (404가 나와야 함)
    const getResponse = await request.get(
      `${API_BASE_URL}/api/notices/${createdNoticeId}`
    );
    
    // 삭제된 공지사항은 조회 불가능해야 함
    expect(getResponse.status()).toBe(404);
    
    // 삭제 후 ID 초기화 (afterAll에서 다시 삭제 시도하지 않도록)
    createdNoticeId = null;
  });
});
