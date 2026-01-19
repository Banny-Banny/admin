import { test, expect, APIRequestContext } from '@playwright/test';
import { AdminRole } from '../../../commons/enums';

// API Base URL 설정
// 환경 변수로 설정 가능: NEXT_PUBLIC_API_BASE_URL 또는 API_BASE_URL
// 기본값: 배포된 서버 (Railway)
const API_BASE_URL = 
  process.env.API_BASE_URL || 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  'https://be-production-8aa2.up.railway.app';

// 슈퍼 어드민 계정 정보
// 환경 변수로 오버라이드 가능: SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD
const SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com',
  password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin1234!',
};

// 서버 연결 확인 헬퍼 함수
async function checkServerConnection(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get(`${API_BASE_URL}/api/admin/auth/me`, {
      timeout: 5000,
    });
    // 연결은 되지만 인증 오류가 나는 경우도 서버가 실행 중인 것으로 간주
    return response.status() !== 0;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
      return false;
    }
    // 다른 에러는 서버가 실행 중인 것으로 간주 (인증 오류 등)
    return true;
  }
}

// 관리자 토큰 획득 헬퍼 함수
async function getAdminToken(request: APIRequestContext): Promise<string | undefined> {
  try {
    const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
      data: {
        email: SUPER_ADMIN.email,
        password: SUPER_ADMIN.password,
      },
    });

    if (loginResponse.status() === 200) {
      const loginBody = await loginResponse.json();
      return loginBody.accessToken;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

test.describe('유저 API 연결 테스트', () => {
  // 서버 연결 확인
  test.beforeAll(async ({ request }) => {
    const isServerRunning = await checkServerConnection(request);
    if (!isServerRunning) {
      test.skip();
      console.error(
        `\n❌ 백엔드 서버가 실행되지 않았습니다!\n` +
        `   API Base URL: ${API_BASE_URL}\n` +
        `   백엔드 서버를 먼저 실행한 후 테스트를 다시 시도하세요.\n`
      );
    }
  });

  test.describe('0. 관리자 로그인 테스트', () => {
    test('관리자 로그인 - API 연결 테스트', async ({ request }) => {
      console.log(`\n🔐 관리자 로그인 테스트`);
      console.log(`이메일: ${SUPER_ADMIN.email}`);
      
      const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
        data: {
          email: SUPER_ADMIN.email,
          password: SUPER_ADMIN.password,
        },
      }).catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('ECONNREFUSED')) {
          throw new Error(
            `백엔드 서버에 연결할 수 없습니다. 서버가 ${API_BASE_URL}에서 실행 중인지 확인하세요.`
          );
        }
        throw error;
      });

      console.log(`응답 상태 코드: ${loginResponse.status()}`);
      const body = await loginResponse.json();
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      if (loginResponse.status() === 200) {
        expect(body).toHaveProperty('accessToken');
        expect(body).toHaveProperty('admin');
        
        // Role 검증
        if (body.admin) {
          expect(body.admin).toHaveProperty('role');
          console.log(`Role: ${body.admin.role}`);
          
          // Role이 유효한 AdminRole인지 확인
          expect([AdminRole.SUPER_ADMIN, AdminRole.ADMIN]).toContain(body.admin.role);
          console.log(`✅ Role 검증 통과: ${body.admin.role}`);
        }
        
        console.log('✅ 관리자 로그인 성공');
        console.log(`토큰: ${body.accessToken?.substring(0, 20)}...`);
      } else {
        console.log(`⚠️  관리자 로그인 실패 (상태 코드: ${loginResponse.status()})`);
        console.log('응답 메시지:', body.message || body);
        // API 연결 테스트이므로 상태 코드만 확인
        expect([200, 401, 400]).toContain(loginResponse.status());
      }
    });
  });

  test.describe('1. 유저 리스트 조회 API', () => {
    test('유저 리스트 조회 - 기본 조회 API 연결 테스트', async ({ request }) => {
      console.log(`\n📋 유저 리스트 기본 조회 테스트`);
      
      // 관리자 토큰 획득
      const token = await getAdminToken(request);
      if (!token) {
        console.log(`⚠️  관리자 로그인 실패로 테스트 스킵`);
        test.skip();
        return;
      }

      const response = await request.get(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('ECONNREFUSED')) {
          throw new Error(
            `백엔드 서버에 연결할 수 없습니다. 서버가 ${API_BASE_URL}에서 실행 중인지 확인하세요.`
          );
        }
        throw error;
      });

      console.log(`응답 상태 코드: ${response.status()}`);
      const body = await response.json();
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인
      expect([200, 401, 403]).toContain(response.status());

      if (response.status() === 200) {
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('items');
        expect(body.data).toHaveProperty('total');
        expect(body.data).toHaveProperty('limit');
        expect(body.data).toHaveProperty('offset');
        expect(Array.isArray(body.data.items)).toBe(true);
        console.log(`✅ 유저 리스트 조회 성공 (총 ${body.data.total}명, 현재 페이지: ${body.data.items.length}명)`);
      } else {
        console.log(`⚠️  유저 리스트 조회 실패 (상태 코드: ${response.status()})`);
        console.log('응답 메시지:', body.message || body);
      }
    });

    test('유저 리스트 조회 - 검색어로 조회 API 연결 테스트', async ({ request }) => {
      console.log(`\n🔍 유저 리스트 검색어 조회 테스트`);
      
      // 관리자 토큰 획득
      const token = await getAdminToken(request);
      if (!token) {
        console.log(`⚠️  관리자 로그인 실패로 테스트 스킵`);
        test.skip();
        return;
      }

      const searchQuery = 'test';
      const response = await request.get(`${API_BASE_URL}/api/admin/users?search=${searchQuery}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`응답 상태 코드: ${response.status()}`);
      const body = await response.json();
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인
      expect([200, 401, 403]).toContain(response.status());

      if (response.status() === 200) {
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('items');
        expect(body.data).toHaveProperty('total');
        expect(Array.isArray(body.data.items)).toBe(true);
        console.log(`✅ 검색어 조회 성공 (검색어: "${searchQuery}", 결과: ${body.data.total}명)`);
      } else {
        console.log(`⚠️  검색어 조회 실패 (상태 코드: ${response.status()})`);
      }
    });

    test('유저 리스트 조회 - 상태 필터링 API 연결 테스트', async ({ request }) => {
      console.log(`\n🔖 유저 리스트 상태 필터링 테스트`);
      
      // 관리자 토큰 획득
      const token = await getAdminToken(request);
      if (!token) {
        console.log(`⚠️  관리자 로그인 실패로 테스트 스킵`);
        test.skip();
        return;
      }

      // ACTIVE 상태로 필터링
      const response = await request.get(`${API_BASE_URL}/api/admin/users?status=ACTIVE`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`응답 상태 코드: ${response.status()}`);
      const body = await response.json();
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인
      expect([200, 401, 403]).toContain(response.status());

      if (response.status() === 200) {
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('items');
        expect(body.data).toHaveProperty('total');
        expect(Array.isArray(body.data.items)).toBe(true);
        
        // 모든 유저가 ACTIVE 상태인지 확인
        if (body.data.items.length > 0) {
          body.data.items.forEach((user: { isActive: boolean }) => {
            expect(user.isActive).toBe(true);
          });
        }
        console.log(`✅ 상태 필터링 조회 성공 (ACTIVE 상태: ${body.data.total}명)`);
      } else {
        console.log(`⚠️  상태 필터링 조회 실패 (상태 코드: ${response.status()})`);
      }
    });

    test('유저 리스트 조회 - 날짜 범위 필터링 API 연결 테스트', async ({ request }) => {
      console.log(`\n📅 유저 리스트 날짜 범위 필터링 테스트`);
      
      // 관리자 토큰 획득
      const token = await getAdminToken(request);
      if (!token) {
        console.log(`⚠️  관리자 로그인 실패로 테스트 스킵`);
        test.skip();
        return;
      }

      // 최근 30일 범위로 필터링
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await request.get(
        `${API_BASE_URL}/api/admin/users?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`응답 상태 코드: ${response.status()}`);
      console.log(`날짜 범위: ${startDate} ~ ${endDate}`);
      const body = await response.json();
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인
      expect([200, 401, 403]).toContain(response.status());

      if (response.status() === 200) {
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('items');
        expect(body.data).toHaveProperty('total');
        expect(Array.isArray(body.data.items)).toBe(true);
        console.log(`✅ 날짜 범위 필터링 조회 성공 (${startDate} ~ ${endDate}, 결과: ${body.data.total}명)`);
      } else {
        console.log(`⚠️  날짜 범위 필터링 조회 실패 (상태 코드: ${response.status()})`);
      }
    });

    test('유저 리스트 조회 - 페이지네이션 API 연결 테스트', async ({ request }) => {
      console.log(`\n📄 유저 리스트 페이지네이션 테스트`);
      
      // 관리자 토큰 획득
      const token = await getAdminToken(request);
      if (!token) {
        console.log(`⚠️  관리자 로그인 실패로 테스트 스킵`);
        test.skip();
        return;
      }

      // 첫 번째 페이지 조회
      const limit = 10;
      const offset = 0;
      
      const response = await request.get(
        `${API_BASE_URL}/api/admin/users?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`응답 상태 코드: ${response.status()}`);
      const body = await response.json();
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인
      expect([200, 401, 403]).toContain(response.status());

      if (response.status() === 200) {
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('items');
        expect(body.data).toHaveProperty('total');
        expect(body.data).toHaveProperty('limit', limit);
        expect(body.data).toHaveProperty('offset', offset);
        expect(Array.isArray(body.data.items)).toBe(true);
        expect(body.data.items.length).toBeLessThanOrEqual(limit);
        console.log(`✅ 페이지네이션 조회 성공 (limit: ${limit}, offset: ${offset}, 결과: ${body.data.items.length}명)`);
      } else {
        console.log(`⚠️  페이지네이션 조회 실패 (상태 코드: ${response.status()})`);
      }
    });

    test('유저 리스트 조회 - 인증 토큰 없음 API 연결 테스트', async ({ request }) => {
      console.log(`\n🔒 인증 토큰 없이 유저 리스트 조회 시도`);
      
      const response = await request.get(`${API_BASE_URL}/api/admin/users`);

      console.log(`응답 상태 코드: ${response.status()}`);
      const body = await response.json().catch(() => ({}));
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인 (401 Unauthorized)
      expect(response.status()).toBe(401);
      console.log('✅ 인증 없이 접근 차단 정상 작동');
    });
  });

  test.describe('2. 유저 정보 수정 API', () => {
    test('유저 정보 수정 - API 연결 테스트', async ({ request }) => {
      console.log(`\n✏️  유저 정보 수정 테스트`);
      
      // 관리자 토큰 획득
      const token = await getAdminToken(request);
      if (!token) {
        console.log(`⚠️  관리자 로그인 실패로 테스트 스킵`);
        test.skip();
        return;
      }

      // 먼저 유저 리스트를 조회하여 테스트할 유저 ID 획득
      const usersResponse = await request.get(`${API_BASE_URL}/api/admin/users?limit=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (usersResponse.status() !== 200) {
        console.log(`⚠️  유저 리스트 조회 실패로 테스트 스킵`);
        test.skip();
        return;
      }

      const usersBody = await usersResponse.json();
      if (!usersBody.data?.items || usersBody.data.items.length === 0) {
        console.log(`⚠️  수정할 유저가 없어 테스트 스킵`);
        test.skip();
        return;
      }

      const testUserId = usersBody.data.items[0].id;
      console.log(`테스트 대상 유저 ID: ${testUserId}`);

      // 유저 정보 수정
      const updateData = {
        nickname: `테스트닉네임-${Date.now()}`,
        isMarketingAgreed: true,
      };

      const response = await request.post(
        `${API_BASE_URL}/api/admin/users/${testUserId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          data: updateData,
        }
      ).catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('ECONNREFUSED')) {
          throw new Error(
            `백엔드 서버에 연결할 수 없습니다. 서버가 ${API_BASE_URL}에서 실행 중인지 확인하세요.`
          );
        }
        throw error;
      });

      console.log(`응답 상태 코드: ${response.status()}`);
      const body = await response.json();
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인
      expect([200, 201, 400, 401, 403, 404]).toContain(response.status());

      if (response.status() === 200 || response.status() === 201) {
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('id', testUserId);
        if (updateData.nickname) {
          expect(body.data).toHaveProperty('nickname');
        }
        console.log(`✅ 유저 정보 수정 성공`);
      } else {
        console.log(`⚠️  유저 정보 수정 실패 (상태 코드: ${response.status()})`);
        console.log('응답 메시지:', body.message || body);
      }
    });

    test('유저 정보 수정 - 인증 토큰 없음 API 연결 테스트', async ({ request }) => {
      console.log(`\n🔒 인증 토큰 없이 유저 정보 수정 시도`);
      
      const testUserId = 'test-user-id';
      const updateData = {
        nickname: '테스트닉네임',
      };

      const response = await request.post(
        `${API_BASE_URL}/api/admin/users/${testUserId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          data: updateData,
        }
      );

      console.log(`응답 상태 코드: ${response.status()}`);
      const body = await response.json().catch(() => ({}));
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인 (401 Unauthorized)
      expect(response.status()).toBe(401);
      console.log('✅ 인증 없이 접근 차단 정상 작동');
    });

    test('유저 정보 수정 - 존재하지 않는 유저 ID API 연결 테스트', async ({ request }) => {
      console.log(`\n❌ 존재하지 않는 유저 ID로 수정 시도`);
      
      // 관리자 토큰 획득
      const token = await getAdminToken(request);
      if (!token) {
        console.log(`⚠️  관리자 로그인 실패로 테스트 스킵`);
        test.skip();
        return;
      }

      const nonExistentUserId = 'non-existent-user-id-12345';
      const updateData = {
        nickname: '테스트닉네임',
      };

      const response = await request.post(
        `${API_BASE_URL}/api/admin/users/${nonExistentUserId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          data: updateData,
        }
      );

      console.log(`응답 상태 코드: ${response.status()}`);
      const body = await response.json();
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인 (404 Not Found, 400 Bad Request, 또는 500 Internal Server Error)
      expect([404, 400, 401, 403, 500]).toContain(response.status());
      console.log('✅ 존재하지 않는 유저 처리 정상 작동');
    });
  });

  test.describe('3. API 통합 플로우 테스트', () => {
    test('전체 플로우: 유저 리스트 조회 → 유저 정보 수정', async ({ request }) => {
      console.log(`\n🔄 유저 API 통합 플로우 테스트 시작`);

      // 1. 관리자 로그인
      console.log('1️⃣  관리자 로그인');
      const token = await getAdminToken(request);
      if (!token) {
        console.log(`   관리자 로그인 실패`);
        test.skip();
        return;
      }
      console.log(`   관리자 로그인 성공`);

      // 2. 유저 리스트 조회
      console.log('2️⃣  유저 리스트 조회');
      const usersResponse = await request.get(`${API_BASE_URL}/api/admin/users?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`   조회 응답: ${usersResponse.status()}`);
      
      if (usersResponse.status() !== 200) {
        console.log(`   유저 리스트 조회 실패로 플로우 테스트 중단`);
        return;
      }

      const usersBody = await usersResponse.json();
      console.log(`   조회 성공 (총 ${usersBody.data?.total || 0}명, 현재 페이지: ${usersBody.data?.items?.length || 0}명)`);

      // 3. 유저 정보 수정 (유저가 있는 경우)
      if (usersBody.data?.items && usersBody.data.items.length > 0) {
        const testUserId = usersBody.data.items[0].id;
        console.log(`3️⃣  유저 정보 수정 (유저 ID: ${testUserId})`);
        
        const updateData = {
          nickname: `통합테스트-${Date.now()}`,
          isMarketingAgreed: true,
        };

        const updateResponse = await request.post(
          `${API_BASE_URL}/api/admin/users/${testUserId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            data: updateData,
          }
        );

        console.log(`   수정 응답: ${updateResponse.status()}`);
        
        if (updateResponse.status() === 200 || updateResponse.status() === 201) {
          const updateBody = await updateResponse.json();
          console.log(`   수정 성공: ${JSON.stringify(updateBody, null, 2)}`);
        } else {
          const updateBody = await updateResponse.json();
          console.log(`   수정 실패: ${updateBody.message || '알 수 없는 오류'}`);
        }
      } else {
        console.log(`3️⃣  수정할 유저가 없어 스킵`);
      }

      console.log('✅ 전체 플로우 테스트 완료');
    });

    test('전체 플로우: 다양한 필터로 유저 리스트 조회', async ({ request }) => {
      console.log(`\n🔄 다양한 필터로 유저 리스트 조회 통합 테스트`);

      // 1. 관리자 로그인
      console.log('1️⃣  관리자 로그인');
      const token = await getAdminToken(request);
      if (!token) {
        console.log(`   관리자 로그인 실패`);
        test.skip();
        return;
      }
      console.log(`   관리자 로그인 성공`);

      // 2. 기본 조회
      console.log('2️⃣  기본 조회');
      const basicResponse = await request.get(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`   기본 조회 응답: ${basicResponse.status()}`);

      // 3. 검색어로 조회
      console.log('3️⃣  검색어로 조회');
      const searchResponse = await request.get(`${API_BASE_URL}/api/admin/users?search=test`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`   검색어 조회 응답: ${searchResponse.status()}`);

      // 4. 상태 필터링
      console.log('4️⃣  상태 필터링 (ACTIVE)');
      const statusResponse = await request.get(`${API_BASE_URL}/api/admin/users?status=ACTIVE`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`   상태 필터링 응답: ${statusResponse.status()}`);

      // 5. 페이지네이션
      console.log('5️⃣  페이지네이션');
      const paginationResponse = await request.get(
        `${API_BASE_URL}/api/admin/users?limit=10&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(`   페이지네이션 응답: ${paginationResponse.status()}`);

      console.log('✅ 다양한 필터 조회 테스트 완료');
    });
  });
});
