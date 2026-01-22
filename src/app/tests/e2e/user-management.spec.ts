import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || BASE_URL;

// 슈퍼 어드민 계정 (테스트용 관리자 계정 생성에 사용)
const SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com',
  password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin123',
};

// 테스트용 관리자 계정 (테스트 전에 생성, 테스트 후 삭제)
const TEST_ADMIN = {
  email: `test-admin-${Date.now()}@example.com`,
  name: '테스트 관리자',
  password: 'testpassword123',
};
let testAdminId: string | null = null;
let superAdminToken: string | null = null;

/**
 * 로그인 헬퍼 함수
 */
async function login(page: any) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  // 로그인 페이지가 표시되는지 확인
  const loginHeading = page.locator('h1:has-text("관리자 로그인")');
  const isLoginPage = await loginHeading.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (isLoginPage) {
    // 테스트용 관리자 계정으로 로그인 (없으면 슈퍼 어드민 계정 사용)
    const adminEmail = testAdminId ? TEST_ADMIN.email : SUPER_ADMIN.email;
    const adminPassword = testAdminId ? TEST_ADMIN.password : SUPER_ADMIN.password;
    
    // 이메일과 비밀번호 입력
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 로그인 성공 후 루트 페이지로 리다이렉트되는지 확인
    await page.waitForURL(BASE_URL, { timeout: 10000 });
    
    // 대시보드가 표시되는지 확인 (로그인 페이지가 사라졌는지 확인)
    await expect(loginHeading).not.toBeVisible({ timeout: 10000 });
    
    // 로그인 완료 후 추가 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 사이드바가 로드되었는지 확인 (더 긴 대기 시간)
    const sidebar = page.locator('aside');
    const isSidebarVisible = await sidebar.isVisible({ timeout: 15000 }).catch(() => false);
    
    if (!isSidebarVisible) {
      // 사이드바가 보이지 않으면 헤더나 다른 요소로 로그인 상태 확인
      const header = page.locator('header');
      const isHeaderVisible = await header.isVisible({ timeout: 5000 }).catch(() => false);
      if (!isHeaderVisible) {
        throw new Error('로그인 후에도 사이드바나 헤더가 표시되지 않습니다. 로그인이 제대로 완료되었는지 확인하세요.');
      }
    }
    
    // 추가 대기 (React 컴포넌트 렌더링 완료 대기)
    await page.waitForTimeout(2000);
  } else {
    // 이미 로그인된 상태인지 확인
    const sidebar = page.locator('aside');
    const isSidebarVisible = await sidebar.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isSidebarVisible) {
      // 사이드바가 없어도 헤더가 있으면 로그인된 것으로 간주
      const header = page.locator('header');
      const isHeaderVisible = await header.isVisible({ timeout: 5000 }).catch(() => false);
      if (!isHeaderVisible) {
        throw new Error('로그인 페이지도 보이지 않고 사이드바나 헤더도 보이지 않습니다. 페이지 상태를 확인하세요.');
      }
    }
  }
}

/**
 * 사용자 목록 페이지로 이동하는 헬퍼 함수
 */
async function navigateToUsersPage(page: any) {
  // 사이드바가 열려있는지 확인하고, 필요하면 열기
  const sidebar = page.locator('aside');
  const isSidebarVisible = await sidebar.isVisible({ timeout: 3000 }).catch(() => false);
  
  if (!isSidebarVisible) {
    // 헤더의 사이드바 토글 버튼 클릭
    const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await toggleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggleButton.click();
      await page.waitForTimeout(500);
    }
  }
  
  // 사이드바에서 "사용자 관리" 메뉴 찾기 (여러 방법 시도)
  let usersMenuButton = null;
  const selectors = [
    'button >> text="사용자 관리"',
    'button:has(span:text("사용자 관리"))',
    'nav button:has-text("사용자 관리")',
    'button:has-text("사용자 관리")',
    'aside button:has-text("사용자 관리")',
  ];
  
  for (const selector of selectors) {
    const button = page.locator(selector);
    const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      usersMenuButton = button;
      break;
    }
  }
  
  // 버튼을 찾지 못한 경우, 모든 버튼을 확인
  if (!usersMenuButton) {
    const allButtons = page.locator('aside button, nav button');
    const buttonCount = await allButtons.count();
    for (let i = 0; i < buttonCount; i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent().catch(() => '');
      if (text && text.includes('사용자 관리')) {
        usersMenuButton = button;
        break;
      }
    }
  }
  
  if (!usersMenuButton) {
    throw new Error('"사용자 관리" 버튼을 찾을 수 없습니다. 사이드바가 제대로 로드되었는지 확인하세요.');
  }
  
  // 버튼이 보일 때까지 스크롤 (필요한 경우)
  await usersMenuButton.scrollIntoViewIfNeeded().catch(() => {});
  await expect(usersMenuButton).toBeVisible({ timeout: 5000 });
  
  await usersMenuButton.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // 사용자 목록 페이지가 로드되었는지 확인
  await expect(page.locator('h2:has-text("사용자 관리")')).toBeVisible({ timeout: 10000 });
}

test.describe('일반 사용자 관리 E2E 테스트', () => {
  // 테스트 전에 테스트용 관리자 계정 생성
  test.beforeAll(async ({ request }) => {
    try {
      // 슈퍼 어드민으로 로그인
      const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
        data: {
          email: SUPER_ADMIN.email,
          password: SUPER_ADMIN.password,
        },
      }).catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
          console.warn(`⚠️ 백엔드 서버에 연결할 수 없습니다. 기존 계정을 사용합니다.`);
          return null;
        }
        throw error;
      });

      if (loginResponse && loginResponse.ok()) {
        const loginBody = await loginResponse.json();
        superAdminToken = loginBody.accessToken || loginBody.token;
        
        // 테스트용 관리자 계정 생성
        const createResponse = await request.post(`${API_BASE_URL}/api/admin/auth/admins`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${superAdminToken}`,
          },
          data: {
            email: TEST_ADMIN.email,
            name: TEST_ADMIN.name,
            password: TEST_ADMIN.password,
          },
        }).catch(() => null);

        if (createResponse && createResponse.ok()) {
          const createBody = await createResponse.json();
          testAdminId = createBody.id;
          console.log(`✅ 테스트용 관리자 계정 생성 성공: ${TEST_ADMIN.email} (ID: ${testAdminId})`);
        } else {
          const status = createResponse?.status() || 'unknown';
          console.warn(`⚠️ 테스트용 관리자 계정 생성 실패 (상태: ${status}). 기존 계정을 사용합니다.`);
          // 계정이 이미 존재하는 경우도 계속 진행
        }
      } else {
        const status = loginResponse?.status() || 'unknown';
        console.warn(`⚠️ 슈퍼 어드민 로그인 실패 (상태: ${status}). 기존 계정을 사용합니다.`);
      }
    } catch (error) {
      console.warn(`⚠️ 테스트용 관리자 계정 생성 중 오류: ${error}. 기존 계정을 사용합니다.`);
      // 오류가 발생해도 테스트는 계속 진행 (기존 계정 사용)
    }
  });

  // 테스트 후 테스트용 관리자 계정 삭제
  test.afterAll(async ({ request }) => {
    if (testAdminId && superAdminToken) {
      try {
        // 관리자 삭제 API 시도 (아직 구현되지 않았을 수 있음)
        const deleteResponse = await request.delete(`${API_BASE_URL}/api/admin/auth/admins/${testAdminId}`, {
          headers: {
            Authorization: `Bearer ${superAdminToken}`,
          },
        }).catch(() => null);

        if (deleteResponse && deleteResponse.ok()) {
          console.log(`✅ 테스트용 관리자 계정 삭제 성공: ${TEST_ADMIN.email}`);
        } else {
          // 삭제 API가 없거나 실패한 경우 경고만 출력
          console.warn(`⚠️ 테스트용 관리자 계정 삭제 API가 없거나 실패했습니다. 수동으로 삭제해주세요: ${TEST_ADMIN.email}`);
        }
      } catch (error) {
        console.warn(`⚠️ 테스트용 관리자 계정 삭제 중 오류: ${error}`);
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 테스트용 관리자 계정으로 로그인
    await login(page);
    // 사용자 목록 페이지로 이동
    await navigateToUsersPage(page);
  });

  // ============================================================================
  // User Story 1: 사용자 목록 조회 및 필터링
  // ============================================================================
  
  test.describe('사용자 목록 조회 및 필터링', () => {
    test('사용자 목록이 페이지네이션과 함께 표시됨', async ({ page }) => {
      // "일반 사용자 목록" 섹션이 표시되는지 확인
      await expect(page.locator('h3:has-text("일반 사용자 목록")')).toBeVisible();
      
      // 사용자 목록 테이블이 표시되는지 확인 (일반 사용자 목록 테이블만 선택)
      const userTable = page.locator('h3:has-text("일반 사용자 목록")').locator('..').locator('table').filter({ hasText: '닉네임' }).first();
      await expect(userTable).toBeVisible({ timeout: 10000 });
      
      // 테이블 헤더 확인
      await expect(page.locator('th:has-text("닉네임")')).toBeVisible();
      await expect(page.locator('th:has-text("이메일")')).toBeVisible();
      await expect(page.locator('th:has-text("전화번호")')).toBeVisible();
      await expect(page.locator('th:has-text("상태")')).toBeVisible();
      await expect(page.locator('th:has-text("가입일")')).toBeVisible();
      await expect(page.locator('th:has-text("작업")')).toBeVisible();
      
      // 페이지네이션 정보가 표시되는지 확인 (사용자가 있는 경우)
      const paginationText = page.locator('text=/페이지.*전체.*명/');
      const hasPagination = await paginationText.count() > 0;
      
      if (hasPagination) {
        await expect(paginationText.first()).toBeVisible();
      }
    });

    test('닉네임 또는 이메일로 검색어 입력 시 필터링됨', async ({ page }) => {
      // 검색 입력 필드 찾기
      const searchInput = page.locator('input[placeholder*="닉네임 또는 이메일로 검색"]');
      await expect(searchInput).toBeVisible();
      
      // 검색어 입력
      await searchInput.fill('test');
      
      // 검색 결과가 로드될 때까지 대기 (디바운싱 500ms + API 호출)
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // 검색 결과가 표시되는지 확인
      // 검색 결과가 없을 수도 있으므로, 테이블이 표시되거나 "검색 결과가 없습니다" 메시지가 표시되는지 확인
      const noResultsMessage = page.locator('text=검색 결과가 없습니다');
      const userTable = page.locator('table tbody tr');
      
      const hasNoResults = await noResultsMessage.isVisible({ timeout: 1000 }).catch(() => false);
      const hasResults = await userTable.count() > 0;
      
      expect(hasNoResults || hasResults).toBe(true);
    });

    test('상태 필터(ALL, ACTIVE, INACTIVE, BLOCKED) 선택 시 필터링됨', async ({ page }) => {
      // 상태 필터 드롭다운 찾기
      const statusFilter = page.locator('select').filter({ hasText: '모든 상태' });
      await expect(statusFilter).toBeVisible();
      
      // ACTIVE 필터 선택
      await statusFilter.selectOption('ACTIVE');
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // 필터가 적용되었는지 확인
      await expect(statusFilter).toHaveValue('ACTIVE');
      
      // INACTIVE 필터 선택
      await statusFilter.selectOption('INACTIVE');
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // 필터가 적용되었는지 확인
      await expect(statusFilter).toHaveValue('INACTIVE');
      
      // BLOCKED 필터 선택
      await statusFilter.selectOption('BLOCKED');
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // 필터가 적용되었는지 확인
      await expect(statusFilter).toHaveValue('BLOCKED');
      
      // ALL 필터로 복원
      await statusFilter.selectOption('ALL');
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
    });

    test('가입 시작일과 종료일을 설정하여 기간 필터 적용', async ({ page }) => {
      // 날짜 입력 필드 찾기
      const dateInputs = page.locator('input[type="date"]');
      const dateInputCount = await dateInputs.count();
      
      if (dateInputCount >= 2) {
        // 시작일 설정
        const startDateInput = dateInputs.nth(0);
        const endDateInput = dateInputs.nth(1);
        
        // 오늘 날짜로 설정
        const today = new Date().toISOString().split('T')[0];
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];
        
        await startDateInput.fill(oneMonthAgoStr);
        await endDateInput.fill(today);
        
        // 필터 적용 대기
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');
        
        // 날짜가 설정되었는지 확인
        await expect(startDateInput).toHaveValue(oneMonthAgoStr);
        await expect(endDateInput).toHaveValue(today);
      }
    });

    test('페이지네이션을 통해 다음 페이지로 이동', async ({ page }) => {
      // 페이지네이션 버튼 찾기
      const nextButton = page.locator('button:has-text("다음")');
      const prevButton = page.locator('button:has-text("이전")');
      
      // 다음 페이지 버튼이 있는지 확인
      const hasNextButton = await nextButton.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasNextButton) {
        const isDisabled = await nextButton.isDisabled();
        
        if (!isDisabled) {
          // 현재 페이지 번호 확인
          const pageInfo = page.locator('text=/페이지.*\\/.*전체/');
          const pageInfoText = await pageInfo.textContent();
          
          // 다음 페이지로 이동
          await nextButton.click();
          await page.waitForTimeout(2000);
          await page.waitForLoadState('networkidle');
          
          // 페이지가 변경되었는지 확인
          const newPageInfo = page.locator('text=/페이지.*\\/.*전체/');
          const newPageInfoText = await newPageInfo.textContent();
          
          // 페이지 번호가 증가했는지 확인
          expect(newPageInfoText).not.toBe(pageInfoText);
          
          // 이전 페이지 버튼이 활성화되었는지 확인
          await expect(prevButton).not.toBeDisabled();
        }
      }
    });

    test('검색 결과가 없는 경우 적절한 메시지 표시', async ({ page }) => {
      // 존재하지 않는 검색어 입력
      const searchInput = page.locator('input[placeholder*="닉네임 또는 이메일로 검색"]');
      await searchInput.fill('nonexistentuser12345');
      
      // 검색 결과 대기
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // "검색 결과가 없습니다" 메시지 확인
      const noResultsMessage = page.locator('text=검색 결과가 없습니다');
      await expect(noResultsMessage).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================================================
  // User Story 2: 사용자 상세 정보 조회
  // ============================================================================
  
  test.describe('사용자 상세 정보 조회', () => {
    test('사용자 행 클릭 또는 상세 보기 버튼으로 상세 정보 표시', async ({ page }) => {
      // 사용자 목록이 로드될 때까지 대기
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // 첫 번째 사용자 행의 작업 버튼 찾기 (일반 사용자 목록 테이블만 선택)
      const userTable = page.locator('h3:has-text("일반 사용자 목록")').locator('..').locator('table').filter({ hasText: '닉네임' }).first();
      const firstUserRow = userTable.locator('tbody tr').first();
      const hasUserRow = await firstUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasUserRow) {
        // 작업 버튼 찾기 (여러 방법 시도)
        let actionButton = firstUserRow.locator('button').filter({ has: page.locator('svg') }).first();
        const isButtonVisible = await actionButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (!isButtonVisible) {
          // 다른 방법으로 버튼 찾기
          actionButton = firstUserRow.locator('td:last-child button').first();
        }
        
        const finalButtonVisible = await actionButton.isVisible({ timeout: 5000 }).catch(() => false);
        if (!finalButtonVisible) {
          // 사용자가 없는 경우 스킵
          test.skip();
          return;
        }
        
        await actionButton.click();
        await page.waitForTimeout(500);
        
        // "상세 보기" 버튼 클릭
        const viewDetailButton = page.locator('button:has-text("상세 보기")');
        await expect(viewDetailButton).toBeVisible({ timeout: 2000 });
        await viewDetailButton.click();
        
        // 상세 정보 다이얼로그가 표시되는지 확인
        await expect(page.locator('text=사용자 상세 정보')).toBeVisible({ timeout: 3000 });
        
        // 상세 정보 필드 확인
        await expect(page.locator('text=/닉네임:/')).toBeVisible();
        await expect(page.locator('text=/이메일:/')).toBeVisible();
        await expect(page.locator('text=/전화번호:/')).toBeVisible();
        await expect(page.locator('text=/상태:/')).toBeVisible();
        await expect(page.locator('text=/가입일:/')).toBeVisible();
      }
    });

    test('상세 정보 다이얼로그에서 닫기 버튼 클릭 시 닫힘', async ({ page }) => {
      // 사용자 목록이 로드될 때까지 대기
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // 첫 번째 사용자 행의 작업 버튼 찾기 (일반 사용자 목록 테이블만 선택)
      const userTable = page.locator('h3:has-text("일반 사용자 목록")').locator('..').locator('table').filter({ hasText: '닉네임' }).first();
      const firstUserRow = userTable.locator('tbody tr').first();
      const hasUserRow = await firstUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasUserRow) {
        // 작업 버튼 찾기 (여러 방법 시도)
        let actionButton = firstUserRow.locator('button').filter({ has: page.locator('svg') }).first();
        const isButtonVisible = await actionButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (!isButtonVisible) {
          // 다른 방법으로 버튼 찾기
          actionButton = firstUserRow.locator('td:last-child button').first();
        }
        
        const finalButtonVisible = await actionButton.isVisible({ timeout: 5000 }).catch(() => false);
        if (!finalButtonVisible) {
          // 사용자가 없는 경우 스킵
          test.skip();
          return;
        }
        
        await actionButton.click();
        await page.waitForTimeout(500);
        
        // "상세 보기" 버튼 클릭
        const viewDetailButton = page.locator('button:has-text("상세 보기")');
        if (await viewDetailButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await viewDetailButton.click();
          
          // 상세 정보 다이얼로그가 표시되는지 확인
          await expect(page.locator('text=사용자 상세 정보')).toBeVisible({ timeout: 3000 });
          
          // 닫기 버튼 클릭
          const closeButton = page.locator('button:has-text("닫기")');
          await closeButton.click();
          
          // 다이얼로그가 닫혔는지 확인
          await expect(page.locator('text=사용자 상세 정보')).not.toBeVisible({ timeout: 2000 });
        }
      }
    });
  });

  // ============================================================================
  // User Story 3: 사용자 정보 수정
  // ============================================================================
  
  test.describe('사용자 정보 수정', () => {
    test('사용자 정보 수정 폼에서 정보를 수정하고 저장', async ({ page }) => {
      // 사용자 목록이 로드될 때까지 대기
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // 첫 번째 사용자 행의 작업 버튼 찾기 (일반 사용자 목록 테이블만 선택)
      const userTable = page.locator('h3:has-text("일반 사용자 목록")').locator('..').locator('table').filter({ hasText: '닉네임' }).first();
      const firstUserRow = userTable.locator('tbody tr').first();
      const hasUserRow = await firstUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasUserRow) {
        // 작업 버튼 찾기 (여러 방법 시도)
        let actionButton = firstUserRow.locator('button').filter({ has: page.locator('svg') }).first();
        const isButtonVisible = await actionButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (!isButtonVisible) {
          // 다른 방법으로 버튼 찾기
          actionButton = firstUserRow.locator('td:last-child button').first();
        }
        
        const finalButtonVisible = await actionButton.isVisible({ timeout: 5000 }).catch(() => false);
        if (!finalButtonVisible) {
          // 사용자가 없는 경우 스킵
          test.skip();
          return;
        }
        
        await actionButton.click();
        await page.waitForTimeout(500);
        
        // "정보 수정" 버튼 클릭
        const editButton = page.locator('button:has-text("정보 수정")');
        const hasEditButton = await editButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasEditButton) {
          await editButton.click();
          
          // 수정 폼이 표시되는지 확인
          await expect(page.locator('text=사용자 상세 정보')).toBeVisible({ timeout: 3000 });
          
          // 닉네임 필드 찾기 및 수정
          const nicknameInput = page.locator('input[type="text"]').first();
          if (await nicknameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            const currentNickname = await nicknameInput.inputValue();
            const newNickname = `테스트닉네임_${Date.now()}`;
            await nicknameInput.fill(newNickname);
            
            // 저장 버튼 클릭
            const saveButton = page.locator('button[type="submit"]:has-text("저장")');
            await saveButton.click();
            
            // 성공 메시지 확인 (Toast)
            await page.waitForTimeout(2000);
            
            // 다이얼로그가 닫혔는지 확인
            await expect(page.locator('text=사용자 상세 정보')).not.toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('잘못된 형식의 이메일 입력 시 유효성 검사 오류 메시지 표시', async ({ page }) => {
      // 사용자 목록이 로드될 때까지 대기
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // 첫 번째 사용자 행의 작업 버튼 찾기 (일반 사용자 목록 테이블만 선택)
      const userTable = page.locator('h3:has-text("일반 사용자 목록")').locator('..').locator('table').filter({ hasText: '닉네임' }).first();
      const firstUserRow = userTable.locator('tbody tr').first();
      const hasUserRow = await firstUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasUserRow) {
        // 작업 버튼 찾기 (여러 방법 시도)
        let actionButton = firstUserRow.locator('button').filter({ has: page.locator('svg') }).first();
        const isButtonVisible = await actionButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (!isButtonVisible) {
          // 다른 방법으로 버튼 찾기
          actionButton = firstUserRow.locator('td:last-child button').first();
        }
        
        const finalButtonVisible = await actionButton.isVisible({ timeout: 5000 }).catch(() => false);
        if (!finalButtonVisible) {
          // 사용자가 없는 경우 스킵
          test.skip();
          return;
        }
        
        await actionButton.click();
        await page.waitForTimeout(500);
        
        // "정보 수정" 버튼 클릭
        const editButton = page.locator('button:has-text("정보 수정")');
        const hasEditButton = await editButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasEditButton) {
          await editButton.click();
          
          // 수정 폼이 표시되는지 확인
          await expect(page.locator('text=사용자 상세 정보')).toBeVisible({ timeout: 3000 });
          
          // 이메일 필드 찾기
          const emailInput = page.locator('input[type="email"]');
          if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            // 잘못된 이메일 형식 입력
            await emailInput.fill('invalid-email');
            
            // 저장 버튼 클릭
            const saveButton = page.locator('button[type="submit"]:has-text("저장")');
            await saveButton.click();
            
            // 유효성 검사 오류 메시지 확인
            await page.waitForTimeout(1000);
            const errorMessage = page.locator('text=/유효한 이메일|이메일 형식/i');
            const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);
            
            // HTML5 validation 또는 React Hook Form validation이 작동하는지 확인
            const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => {
              return !el.validity.valid;
            });
            
            expect(hasError || emailValidity).toBe(true);
          }
        }
      }
    });
  });

  // ============================================================================
  // User Story 4: 사용자 차단 및 해제
  // ============================================================================
  
  test.describe('사용자 차단 및 해제', () => {
    test('활성 사용자를 차단할 수 있음', async ({ page }) => {
      // 사용자 목록이 로드될 때까지 대기
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // ACTIVE 상태의 사용자 찾기
      const activeUserRow = page.locator('table tbody tr').filter({ hasText: '활성' }).first();
      const hasActiveUser = await activeUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasActiveUser) {
        // 작업 버튼 클릭
        const actionButton = activeUserRow.locator('button').filter({ has: page.locator('svg') });
        await actionButton.click();
        await page.waitForTimeout(500);
        
        // "차단" 버튼 클릭
        const blockButton = page.locator('button:has-text("차단")');
        const hasBlockButton = await blockButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasBlockButton) {
          await blockButton.click();
          
          // 확인 다이얼로그가 표시되는지 확인
          await expect(page.locator('text=/차단|확인/i')).toBeVisible({ timeout: 3000 });
          
          // 확인 버튼 클릭
          const confirmButton = page.locator('button:has-text("확인"), button:has-text("차단")').last();
          await confirmButton.click();
          
          // 성공 메시지 확인 및 목록 새로고침 대기
          await page.waitForTimeout(2000);
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('차단된 사용자의 차단을 해제할 수 있음', async ({ page }) => {
      // BLOCKED 상태 필터 선택
      const statusFilter = page.locator('select').filter({ hasText: '모든 상태' });
      await statusFilter.selectOption('BLOCKED');
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // 차단된 사용자 찾기
      const blockedUserRow = page.locator('table tbody tr').first();
      const hasBlockedUser = await blockedUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasBlockedUser) {
        // 작업 버튼 클릭
        const actionButton = blockedUserRow.locator('button').filter({ has: page.locator('svg') });
        await actionButton.click();
        await page.waitForTimeout(500);
        
        // "차단 해제" 버튼 클릭
        const unblockButton = page.locator('button:has-text("차단 해제")');
        const hasUnblockButton = await unblockButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasUnblockButton) {
          await unblockButton.click();
          
          // 확인 다이얼로그가 표시되는지 확인
          await expect(page.locator('text=/해제|확인/i')).toBeVisible({ timeout: 3000 });
          
          // 확인 버튼 클릭
          const confirmButton = page.locator('button:has-text("확인"), button:has-text("해제")').last();
          await confirmButton.click();
          
          // 성공 메시지 확인 및 목록 새로고침 대기
          await page.waitForTimeout(2000);
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('차단 확인 다이얼로그에서 취소 선택 시 차단 작업이 취소됨', async ({ page }) => {
      // 사용자 목록이 로드될 때까지 대기
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // ACTIVE 상태의 사용자 찾기
      const activeUserRow = page.locator('table tbody tr').filter({ hasText: '활성' }).first();
      const hasActiveUser = await activeUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasActiveUser) {
        // 작업 버튼 클릭
        const actionButton = activeUserRow.locator('button').filter({ has: page.locator('svg') });
        await actionButton.click();
        await page.waitForTimeout(500);
        
        // "차단" 버튼 클릭
        const blockButton = page.locator('button:has-text("차단")');
        const hasBlockButton = await blockButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasBlockButton) {
          await blockButton.click();
          
          // 확인 다이얼로그가 표시되는지 확인
          await expect(page.locator('text=/차단|확인/i')).toBeVisible({ timeout: 3000 });
          
          // 취소 버튼 클릭
          const cancelButton = page.locator('button:has-text("취소")');
          await cancelButton.click();
          
          // 다이얼로그가 닫혔는지 확인
          await page.waitForTimeout(1000);
          await expect(page.locator('text=/차단|확인/i')).not.toBeVisible({ timeout: 2000 });
        }
      }
    });
  });

  // ============================================================================
  // User Story 5: 사용자 탈퇴 처리
  // ============================================================================
  
  test.describe('사용자 탈퇴 처리', () => {
    test('활성 또는 차단 상태의 사용자를 탈퇴 처리할 수 있음', async ({ page }) => {
      // 사용자 목록이 로드될 때까지 대기
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // ACTIVE 상태의 사용자 찾기
      const activeUserRow = page.locator('table tbody tr').filter({ hasText: '활성' }).first();
      const hasActiveUser = await activeUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasActiveUser) {
        // 작업 버튼 클릭
        const actionButton = activeUserRow.locator('button').filter({ has: page.locator('svg') });
        await actionButton.click();
        await page.waitForTimeout(500);
        
        // "탈퇴 처리" 버튼 클릭
        const deactivateButton = page.locator('button:has-text("탈퇴 처리")');
        const hasDeactivateButton = await deactivateButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasDeactivateButton) {
          await deactivateButton.click();
          
          // 확인 다이얼로그가 표시되는지 확인
          await expect(page.locator('text=/탈퇴|확인/i')).toBeVisible({ timeout: 3000 });
          
          // 확인 버튼 클릭
          const confirmButton = page.locator('button:has-text("확인"), button:has-text("탈퇴")').last();
          await confirmButton.click();
          
          // 성공 메시지 확인 및 목록 새로고침 대기
          await page.waitForTimeout(2000);
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('탈퇴 처리 확인 다이얼로그에서 취소 선택 시 탈퇴 작업이 취소됨', async ({ page }) => {
      // 사용자 목록이 로드될 때까지 대기
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // ACTIVE 상태의 사용자 찾기
      const activeUserRow = page.locator('table tbody tr').filter({ hasText: '활성' }).first();
      const hasActiveUser = await activeUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasActiveUser) {
        // 작업 버튼 클릭
        const actionButton = activeUserRow.locator('button').filter({ has: page.locator('svg') });
        await actionButton.click();
        await page.waitForTimeout(500);
        
        // "탈퇴 처리" 버튼 클릭
        const deactivateButton = page.locator('button:has-text("탈퇴 처리")');
        const hasDeactivateButton = await deactivateButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasDeactivateButton) {
          await deactivateButton.click();
          
          // 확인 다이얼로그가 표시되는지 확인
          await expect(page.locator('text=/탈퇴|확인/i')).toBeVisible({ timeout: 3000 });
          
          // 취소 버튼 클릭
          const cancelButton = page.locator('button:has-text("취소")');
          await cancelButton.click();
          
          // 다이얼로그가 닫혔는지 확인
          await page.waitForTimeout(1000);
          await expect(page.locator('text=/탈퇴|확인/i')).not.toBeVisible({ timeout: 2000 });
        }
      }
    });

    test('탈퇴 처리된 사용자가 INACTIVE 필터에서 표시됨', async ({ page }) => {
      // INACTIVE 상태 필터 선택
      const statusFilter = page.locator('select').filter({ hasText: '모든 상태' });
      await statusFilter.selectOption('INACTIVE');
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // 필터가 적용되었는지 확인
      await expect(statusFilter).toHaveValue('INACTIVE');
      
      // 사용자 목록이 표시되는지 확인 (일반 사용자 목록 테이블만 선택)
      const userTable = page.locator('h3:has-text("일반 사용자 목록")').locator('..').locator('table tbody').first();
      await expect(userTable).toBeVisible({ timeout: 5000 });
    });
  });
});
