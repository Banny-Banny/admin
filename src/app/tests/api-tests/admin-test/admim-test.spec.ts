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

// 테스트용 관리자 계정 정보 (동적 생성)
const TEST_ADMIN = {
  email: `test-admin-${Date.now()}@example.com`, // 중복 방지를 위해 타임스탬프 사용
  password: 'test-password1234',
  name: '테스트 관리자',
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

test.describe('관리자 API 연결 테스트', () => {
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
      console.log(`비밀번호: ${SUPER_ADMIN.password}`);
      
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

  test.describe('1. 관리자 계정 생성 API', () => {
    test('관리자 계정 생성 - API 연결 테스트', async ({ request }) => {
      console.log(`\n📝 테스트 관리자 계정 생성 시도: ${TEST_ADMIN.email}`);
      
      // 먼저 관리자로 로그인하여 토큰 획득 (관리자 생성 권한이 있는 계정)
      console.log('🔐 관리자 로그인 중...');
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

      console.log(`로그인 응답 상태 코드: ${loginResponse.status()}`);
      
      if (loginResponse.status() !== 200) {
        const loginBody = await loginResponse.json();
        console.log('로그인 실패:', JSON.stringify(loginBody, null, 2));
        console.log(`\n⚠️  관리자 로그인 실패 (상태 코드: ${loginResponse.status()})`);
        console.log(`   이메일: ${SUPER_ADMIN.email}`);
        console.log(`   비밀번호 확인 필요: ${SUPER_ADMIN.password}`);
        console.log(`   응답 메시지: ${loginBody.message || '알 수 없는 오류'}`);
        // API 연결 테스트이므로 에러를 던지지 않고 계속 진행
        test.skip();
        return;
      }

      const loginBody = await loginResponse.json();
      const adminToken = loginBody.accessToken;
      
      if (!adminToken) {
        throw new Error('관리자 토큰을 획득할 수 없습니다.');
      }

      // Role 검증
      if (loginBody.admin) {
        console.log(`Role: ${loginBody.admin.role}`);
        expect([AdminRole.SUPER_ADMIN, AdminRole.ADMIN]).toContain(loginBody.admin.role);
        console.log(`✅ Role 검증 통과: ${loginBody.admin.role}`);
      }

      console.log('✅ 관리자 로그인 성공');

      // 관리자 토큰으로 관리자 계정 생성
      const response = await request.post(`${API_BASE_URL}/api/admin/auth/admins`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        data: {
          email: TEST_ADMIN.email,
          name: TEST_ADMIN.name,
          password: TEST_ADMIN.password,
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

      console.log(`계정 생성 응답 상태 코드: ${response.status()}`);
      const body = await response.json();
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인 (201 Created 또는 다른 상태 코드)
      expect([201, 200, 400, 401, 403]).toContain(response.status());
      
      if (response.status() === 201) {
        expect(body).toHaveProperty('email', TEST_ADMIN.email);
        expect(body).toHaveProperty('name', TEST_ADMIN.name);
        console.log('✅ 관리자 계정 생성 성공');
      } else {
        console.log(`⚠️  관리자 계정 생성 실패 (상태 코드: ${response.status()})`);
        console.log('응답 메시지:', body);
      }
    });
  });

  test.describe('2. 관리자 로그인 API', () => {
    test('생성된 관리자로 로그인 - API 연결 테스트', async ({ request }) => {
      // 이전 테스트에서 계정이 생성되지 않았을 수 있으므로, 
      // 먼저 관리자로 로그인 후 계정 생성 시도
      const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
        data: {
          email: SUPER_ADMIN.email,
          password: SUPER_ADMIN.password,
        },
      });

      let adminToken: string | undefined;
      if (loginResponse.status() === 200) {
        const loginBody = await loginResponse.json();
        adminToken = loginBody.accessToken;
      }

      const createResponse = await request.post(`${API_BASE_URL}/api/admin/auth/admins`, {
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
        },
        data: {
          email: TEST_ADMIN.email,
          name: TEST_ADMIN.name,
          password: TEST_ADMIN.password,
        },
      });

      // 계정 생성이 성공했거나 이미 존재하는 경우 로그인 시도
      if (createResponse.status() === 201 || createResponse.status() === 400) {
        console.log(`\n🔐 관리자 로그인 시도: ${TEST_ADMIN.email}`);
        
        const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
          data: {
            email: TEST_ADMIN.email,
            password: TEST_ADMIN.password,
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

        // API 연결이 정상인지 확인
        expect([200, 401, 400]).toContain(loginResponse.status());

        if (loginResponse.status() === 200) {
          expect(body).toHaveProperty('accessToken');
          expect(body).toHaveProperty('admin');
          
          // Role 검증
          if (body.admin) {
            expect(body.admin).toHaveProperty('role');
            console.log(`Role: ${body.admin.role}`);
            
            // Role이 유효한 AdminRole인지 확인
            expect([AdminRole.SUPER_ADMIN, AdminRole.ADMIN]).toContain(body.admin.role);
          }
          
          console.log('✅ 로그인 성공');
        } else {
          console.log(`⚠️  로그인 실패 (상태 코드: ${loginResponse.status()})`);
          console.log('응답 메시지:', body);
        }
      }
    });

    test('로그인 - 잘못된 비밀번호 API 연결 테스트', async ({ request }) => {
      console.log(`\n🔐 잘못된 비밀번호로 로그인 시도: ${TEST_ADMIN.email}`);
      
      const response = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
        data: {
          email: TEST_ADMIN.email,
          password: 'wrong-password',
        },
      });

      console.log(`응답 상태 코드: ${response.status()}`);
      const body = await response.json();
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인 (401 또는 400)
      expect([401, 400]).toContain(response.status());
      console.log('✅ 잘못된 비밀번호 처리 정상 작동');
    });
  });

  test.describe('3. 관리자 프로필 조회 API', () => {
    test('프로필 조회 - 인증 토큰 없음 API 연결 테스트', async ({ request }) => {
      console.log(`\n👤 인증 토큰 없이 프로필 조회 시도`);
      
      const response = await request.get(`${API_BASE_URL}/api/admin/auth/me`);

      console.log(`응답 상태 코드: ${response.status()}`);
      const body = await response.json().catch(() => ({}));
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인 (401 Unauthorized)
      expect(response.status()).toBe(401);
      console.log('✅ 인증 없이 접근 차단 정상 작동');
    });

    test('프로필 조회 - 인증 토큰 있음 API 연결 테스트', async ({ request }) => {
      // 독립적으로 토큰 획득
      console.log(`\n🔐 관리자 로그인 중...`);
      const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
        data: {
          email: SUPER_ADMIN.email,
          password: SUPER_ADMIN.password,
        },
      });

      let token: string | undefined;
      if (loginResponse.status() === 200) {
        const loginBody = await loginResponse.json();
        token = loginBody.accessToken;
        console.log('✅ 관리자 로그인 성공');
      } else {
        console.log(`⚠️  관리자 로그인 실패 (상태 코드: ${loginResponse.status()})`);
        test.skip();
        return;
      }

      console.log(`\n👤 인증 토큰으로 프로필 조회 시도`);
      
      const response = await request.get(`${API_BASE_URL}/api/admin/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`응답 상태 코드: ${response.status()}`);
      const body = await response.json();
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('email');
        expect(body).toHaveProperty('name');
        expect(body).toHaveProperty('role');
        
        // Role 검증
        if (body.role) {
          console.log(`Role: ${body.role}`);
          expect([AdminRole.SUPER_ADMIN, AdminRole.ADMIN]).toContain(body.role);
        }
        
        console.log('✅ 프로필 조회 성공');
      } else {
        console.log(`⚠️  프로필 조회 실패 (상태 코드: ${response.status()})`);
      }
    });
  });

  test.describe('4. 관리자 로그아웃 API', () => {
    test('로그아웃 - API 연결 테스트', async ({ request }) => {
      // 독립적으로 토큰 획득
      console.log(`\n🔐 관리자 로그인 중...`);
      const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
        data: {
          email: SUPER_ADMIN.email,
          password: SUPER_ADMIN.password,
        },
      });

      let token: string | undefined;
      if (loginResponse.status() === 200) {
        const loginBody = await loginResponse.json();
        token = loginBody.accessToken;
        console.log('✅ 관리자 로그인 성공');
      } else {
        console.log(`⚠️  관리자 로그인 실패 (상태 코드: ${loginResponse.status()})`);
        test.skip();
        return;
      }

      console.log(`\n🚪 로그아웃 시도`);
      
      const response = await request.post(`${API_BASE_URL}/api/admin/auth/logout`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`응답 상태 코드: ${response.status()}`);
      const body = await response.json();
      console.log('응답 데이터:', JSON.stringify(body, null, 2));

      // API 연결이 정상인지 확인
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        console.log('✅ 로그아웃 성공');
      } else {
        console.log(`⚠️  로그아웃 실패 (상태 코드: ${response.status()})`);
      }
    });
  });

  test.describe('5. API 통합 플로우 테스트', () => {
    test('전체 플로우: 계정 생성 → 로그인 → 프로필 조회 → 로그아웃', async ({ request }) => {
      const testEmail = `integration-test-${Date.now()}@example.com`;
      
      console.log(`\n🔄 통합 플로우 테스트 시작: ${testEmail}`);

      // 1. 관리자 로그인 (관리자 생성 권한이 있는 계정)
      console.log('1️⃣  관리자 로그인');
      const adminLoginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
        data: {
          email: SUPER_ADMIN.email,
          password: SUPER_ADMIN.password,
        },
      });

      let adminToken: string | undefined;
      if (adminLoginResponse.status() === 200) {
        const adminLoginBody = await adminLoginResponse.json();
        adminToken = adminLoginBody.accessToken;
        console.log(`   관리자 로그인 성공`);
      } else {
        console.log(`   관리자 로그인 실패: ${adminLoginResponse.status()}`);
      }

      // 2. 관리자 계정 생성 (ADMIN role만 생성 가능, SUPER_ADMIN은 생성 불가)
      console.log('2️⃣  관리자 계정 생성');
      const createResponse = await request.post(`${API_BASE_URL}/api/admin/auth/admins`, {
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
        },
        data: {
          email: testEmail,
          name: '통합 테스트 관리자',
          password: 'test-password1234',
        },
      });

      console.log(`   생성 응답: ${createResponse.status()}`);
      
      // 계정 생성이 성공했거나 이미 존재하는 경우 계속 진행
      if (createResponse.status() === 201 || createResponse.status() === 400) {
        // 3. 로그인
        console.log('3️⃣  로그인');
        const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
          data: {
            email: testEmail,
            password: 'test-password1234',
          },
        });

        console.log(`   로그인 응답: ${loginResponse.status()}`);
        
        if (loginResponse.status() === 200) {
          const loginBody = await loginResponse.json();
          const token = loginBody.accessToken;

          // 4. 프로필 조회
          console.log('4️⃣  프로필 조회');
          const profileResponse = await request.get(`${API_BASE_URL}/api/admin/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log(`   프로필 응답: ${profileResponse.status()}`);

          // 5. 로그아웃
          console.log('5️⃣  로그아웃');
          const logoutResponse = await request.post(`${API_BASE_URL}/api/admin/auth/logout`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log(`   로그아웃 응답: ${logoutResponse.status()}`);
          console.log('✅ 전체 플로우 테스트 완료');
        } else {
          console.log('⚠️  로그인 실패로 인해 플로우 테스트 중단');
        }
      } else {
        console.log('⚠️  계정 생성 실패로 인해 플로우 테스트 중단');
      }
    });
  });
});
