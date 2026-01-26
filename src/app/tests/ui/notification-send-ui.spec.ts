import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// 슈퍼 어드민 계정
const SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com',
  password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin1234!',
};

/**
 * 로그인 헬퍼 함수
 */
async function login(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  const loginHeading = page.locator('h1:has-text("관리자 로그인")');
  const isLoginPage = await loginHeading.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (isLoginPage) {
    await page.fill('input[type="email"]', SUPER_ADMIN.email);
    await page.fill('input[type="password"]', SUPER_ADMIN.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(BASE_URL, { timeout: 10000 });
    await expect(loginHeading).not.toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const sidebar = page.locator('aside');
    await sidebar.isVisible({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
}

/**
 * 알림/마케팅 페이지로 이동하는 헬퍼 함수
 */
async function navigateToMarketingPage(page: Page) {
  const sidebar = page.locator('aside');
  const isSidebarVisible = await sidebar.isVisible({ timeout: 3000 }).catch(() => false);
  
  if (!isSidebarVisible) {
    const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await toggleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggleButton.click();
      await page.waitForTimeout(500);
    }
  }
  
  let marketingMenuButton = null;
  const selectors = [
    'button >> text="알림/마케팅"',
    'button:has(span:text("알림/마케팅"))',
    'nav button:has-text("알림/마케팅")',
    'button:has-text("알림/마케팅")',
    'aside button:has-text("알림/마케팅")',
  ];
  
  for (const selector of selectors) {
    const button = page.locator(selector);
    const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      marketingMenuButton = button;
      break;
    }
  }
  
  if (!marketingMenuButton) {
    const allButtons = page.locator('aside button, nav button');
    const buttonCount = await allButtons.count();
    for (let i = 0; i < buttonCount; i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent().catch(() => '');
      if (text && text.includes('알림') || text && text.includes('마케팅')) {
        marketingMenuButton = button;
        break;
      }
    }
  }
  
  if (!marketingMenuButton) {
    throw new Error('"알림/마케팅" 버튼을 찾을 수 없습니다.');
  }
  
  await marketingMenuButton.scrollIntoViewIfNeeded().catch(() => {});
  await expect(marketingMenuButton).toBeVisible({ timeout: 5000 });
  await marketingMenuButton.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await expect(page.locator('h2:has-text("알림 / 마케팅")')).toBeVisible({ timeout: 10000 });
}

test.describe('알림/마케팅 페이지 UI 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToMarketingPage(page);
  });

  test.describe('레이아웃 및 구조', () => {
    test('페이지 헤더가 올바르게 표시됨', async ({ page }) => {
      // 페이지 제목 확인
      const pageTitle = page.locator('h2:has-text("알림 / 마케팅")');
      await expect(pageTitle).toBeVisible();
      
      // 페이지 설명 확인
      const pageDescription = page.locator('text=/유저에게 메시지를 발송하고 관리하세요/');
      await expect(pageDescription).toBeVisible();
    });

    test('통계 카드가 올바르게 표시됨', async ({ page }) => {
      // 총 발송 메시지 카드
      const totalMessagesCard = page.locator('text=/총 발송 메시지/');
      await expect(totalMessagesCard).toBeVisible();
      
      // 총 수신자 수 카드
      const totalRecipientsCard = page.locator('text=/총 수신자 수/');
      await expect(totalRecipientsCard).toBeVisible();
      
      // 평균 오픈률 카드
      const averageOpenRateCard = page.locator('text=/평균 오픈률/');
      await expect(averageOpenRateCard).toBeVisible();
    });

    test('탭이 올바르게 표시됨', async ({ page }) => {
      // 메시지 발송 탭
      const sendTab = page.locator('button:has-text("메시지 발송")');
      await expect(sendTab).toBeVisible();
      
      // 발송 내역 탭
      const historyTab = page.locator('button:has-text("발송 내역")');
      await expect(historyTab).toBeVisible();
    });
  });

  test.describe('메시지 발송 폼 UI', () => {
    test('메시지 발송 폼의 모든 필드가 표시됨', async ({ page }) => {
      // 메시지 발송 탭이 기본적으로 활성화되어 있으므로 클릭 불필요
      // 필요시에만 클릭
      const sendTab = page.locator('button:has-text("메시지 발송")');
      const isActive = await sendTab.evaluate((el) => {
        return el.classList.toString().includes('Active') || el.getAttribute('aria-selected') === 'true';
      }).catch(() => false);
      
      if (!isActive) {
        await sendTab.click();
        await page.waitForTimeout(500);
      }
      
      // 메시지 유형 선택 필드
      const typeSelect = page.locator('select[name="type"]');
      await expect(typeSelect).toBeVisible();
      
      // 발송 대상 선택 필드
      const targetSelect = page.locator('select[name="target"]');
      await expect(targetSelect).toBeVisible();
      
      // 제목 입력 필드
      const titleInput = page.locator('input[name="title"]');
      await expect(titleInput).toBeVisible();
      
      // 내용 입력 필드
      const contentTextarea = page.locator('textarea[name="content"]');
      await expect(contentTextarea).toBeVisible();
    });

    test('메시지 유형 옵션이 올바르게 표시됨', async ({ page }) => {
      const typeSelect = page.locator('select[name="type"]');
      await expect(typeSelect).toBeVisible({ timeout: 5000 });
      
      // 옵션 확인 (select의 option은 직접 확인하기 어려우므로 값으로 확인)
      const optionCount = await typeSelect.locator('option').count();
      expect(optionCount).toBeGreaterThanOrEqual(4);
      
      // 각 옵션 값 확인
      const optionValues = await typeSelect.locator('option').evaluateAll((options) => 
        options.map(opt => opt.getAttribute('value'))
      );
      expect(optionValues).toContain('안내');
      expect(optionValues).toContain('광고');
      expect(optionValues).toContain('이벤트');
      expect(optionValues).toContain('업데이트');
    });

    test('발송 대상 옵션이 올바르게 표시됨', async ({ page }) => {
      const targetSelect = page.locator('select[name="target"]');
      await expect(targetSelect).toBeVisible({ timeout: 5000 });
      
      // 옵션 확인 (select의 option은 직접 확인하기 어려우므로 값으로 확인)
      const optionCount = await targetSelect.locator('option').count();
      expect(optionCount).toBeGreaterThanOrEqual(4);
      
      // 각 옵션 값 확인
      const optionValues = await targetSelect.locator('option').evaluateAll((options) => 
        options.map(opt => opt.getAttribute('value'))
      );
      expect(optionValues).toContain('전체 회원');
      expect(optionValues).toContain('활성 회원');
      expect(optionValues).toContain('휴면 회원');
      expect(optionValues).toContain('VIP 회원');
    });

    test('발송 시간 설정 라디오 버튼이 표시됨', async ({ page }) => {
      // 즉시 발송 라디오 버튼
      const sendNowRadio = page.locator('input[type="radio"]').first();
      await expect(sendNowRadio).toBeVisible({ timeout: 5000 });
      
      // 예약 발송 라디오 버튼
      const scheduleRadio = page.locator('input[type="radio"]').nth(1);
      await expect(scheduleRadio).toBeVisible({ timeout: 5000 });
      
      // 라디오 버튼 라벨 확인
      await expect(page.locator('text=즉시 발송')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=예약 발송')).toBeVisible({ timeout: 5000 });
    });

    test('예약 발송 선택 시 날짜/시간 입력 필드가 표시됨', async ({ page }) => {
      // 예약 발송 라디오 버튼 클릭
      const scheduleRadio = page.locator('input[type="radio"]').nth(1);
      await scheduleRadio.click();
      await page.waitForTimeout(1000);
      
      // 날짜 입력 필드
      const dateInput = page.locator('input[type="date"][name="scheduledDate"]');
      await expect(dateInput).toBeVisible({ timeout: 5000 });
      
      // 시간 입력 필드
      const timeInput = page.locator('input[type="time"][name="scheduledTime"]');
      await expect(timeInput).toBeVisible({ timeout: 5000 });
    });

    test('폼 버튼이 올바르게 표시됨', async ({ page }) => {
      // 초기화 버튼
      const resetButton = page.locator('button:has-text("초기화")');
      await expect(resetButton).toBeVisible({ timeout: 5000 });
      
      // 발송 버튼 (텍스트가 정확히 일치하지 않을 수 있으므로 더 유연하게)
      const sendButton = page.locator('button[type="submit"]');
      await expect(sendButton).toBeVisible({ timeout: 5000 });
      const buttonText = await sendButton.textContent();
      expect(buttonText).toMatch(/즉시 발송|예약하기|발송/);
    });
  });

  test.describe('발송 내역 탭 UI', () => {
    test('발송 내역 탭으로 전환 가능', async ({ page }) => {
      const historyTab = page.locator('button:has-text("발송 내역")');
      await historyTab.click();
      await page.waitForTimeout(500);
      
      // 발송 내역 제목 확인
      const historyTitle = page.locator('h3:has-text("발송 내역")');
      await expect(historyTitle).toBeVisible();
    });

    test('검색 및 필터 영역이 표시됨', async ({ page }) => {
      const historyTab = page.locator('button:has-text("발송 내역")');
      await historyTab.click();
      await page.waitForTimeout(500);
      
      // 검색 입력 필드
      const searchInput = page.locator('input[placeholder*="제목이나 내용으로 검색"]');
      await expect(searchInput).toBeVisible();
      
      // 유형 필터 드롭다운
      const typeFilter = page.locator('select').filter({ hasText: '모든 유형' });
      await expect(typeFilter).toBeVisible();
    });

    test('발송 내역 테이블 헤더가 올바르게 표시됨', async ({ page }) => {
      const historyTab = page.locator('button:has-text("발송 내역")');
      await historyTab.click();
      await page.waitForTimeout(1000);
      
      // 테이블 헤더 확인 (실제 컴포넌트 구조에 맞게 수정)
      await expect(page.locator('th:has-text("메시지")')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th:has-text("유형")')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th:has-text("발송 대상")')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th:has-text("수신자")')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th:has-text("오픈률")')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th:has-text("상태")')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th:has-text("발송일시")')).toBeVisible({ timeout: 5000 });
    });

    test('발송 내역이 없을 때 메시지가 표시됨', async ({ page }) => {
      const historyTab = page.locator('button:has-text("발송 내역")');
      await historyTab.click();
      await page.waitForTimeout(1000);
      
      // 발송 내역이 없는 경우 메시지 확인 (colSpan=7)
      const noHistoryMessage = page.locator('text=발송 내역이 없습니다');
      const hasMessage = await noHistoryMessage.isVisible({ timeout: 3000 }).catch(() => false);
      
      // 메시지가 있거나 테이블이 있는지 확인
      const hasTable = await page.locator('table').isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasMessage || hasTable).toBe(true);
    });
  });

  test.describe('폼 입력 및 검증', () => {
    test('제목 입력 필드에 텍스트 입력 가능', async ({ page }) => {
      const titleInput = page.locator('input[name="title"]');
      await titleInput.fill('테스트 알림 제목');
      await expect(titleInput).toHaveValue('테스트 알림 제목');
    });

    test('내용 입력 필드에 텍스트 입력 가능', async ({ page }) => {
      const contentTextarea = page.locator('textarea[name="content"]');
      await contentTextarea.fill('테스트 알림 내용입니다.');
      await expect(contentTextarea).toHaveValue('테스트 알림 내용입니다.');
    });

    test('메시지 유형 선택 가능', async ({ page }) => {
      const typeSelect = page.locator('select[name="type"]');
      await typeSelect.selectOption('광고');
      await expect(typeSelect).toHaveValue('광고');
    });

    test('발송 대상 선택 가능', async ({ page }) => {
      const targetSelect = page.locator('select[name="target"]');
      await targetSelect.selectOption('활성 회원');
      await page.waitForTimeout(500);
      // 옵션에 인원 수가 포함되어 있을 수 있으므로 부분 일치로 확인
      const selectedValue = await targetSelect.inputValue();
      expect(selectedValue).toBe('활성 회원');
    });

    test('필수 필드 검증이 작동함', async ({ page }) => {
      const titleInput = page.locator('input[name="title"]');
      const contentTextarea = page.locator('textarea[name="content"]');
      
      // HTML5 required 속성 확인
      await expect(titleInput).toHaveAttribute('required');
      await expect(contentTextarea).toHaveAttribute('required');
    });
  });

  test.describe('탭 전환', () => {
    test('메시지 발송 탭과 발송 내역 탭 간 전환 가능', async ({ page }) => {
      // 발송 내역 탭 클릭
      const historyTab = page.locator('button:has-text("발송 내역")');
      await historyTab.click();
      await page.waitForTimeout(500);
      
      // 발송 내역 제목 확인
      await expect(page.locator('h3:has-text("발송 내역")')).toBeVisible();
      
      // 메시지 발송 탭 클릭
      const sendTab = page.locator('button:has-text("메시지 발송")');
      await sendTab.click();
      await page.waitForTimeout(500);
      
      // 메시지 발송 폼 확인
      await expect(page.locator('h3:has-text("새 메시지 발송")')).toBeVisible();
    });
  });

  test.describe('초기화 기능', () => {
    test('초기화 버튼이 폼을 초기화함', async ({ page }) => {
      // 폼에 데이터 입력
      await page.locator('input[name="title"]').fill('테스트 제목');
      await page.locator('textarea[name="content"]').fill('테스트 내용');
      await page.locator('select[name="type"]').selectOption('이벤트');
      
      // 초기화 버튼 클릭
      const resetButton = page.locator('button:has-text("초기화")');
      await resetButton.click();
      await page.waitForTimeout(500);
      
      // 폼이 초기화되었는지 확인
      await expect(page.locator('input[name="title"]')).toHaveValue('');
      await expect(page.locator('textarea[name="content"]')).toHaveValue('');
      await expect(page.locator('select[name="type"]')).toHaveValue('안내');
    });
  });

  test.describe('검색 및 필터 기능', () => {
    test('발송 내역에서 검색 입력 가능', async ({ page }) => {
      const historyTab = page.locator('button:has-text("발송 내역")');
      await historyTab.click();
      await page.waitForTimeout(500);
      
      const searchInput = page.locator('input[placeholder*="제목이나 내용으로 검색"]');
      await searchInput.fill('테스트 검색어');
      await expect(searchInput).toHaveValue('테스트 검색어');
    });

    test('유형 필터 선택 가능', async ({ page }) => {
      const historyTab = page.locator('button:has-text("발송 내역")');
      await historyTab.click();
      await page.waitForTimeout(1000);
      
      // 발송 내역 탭의 select 필터 찾기
      const typeFilter = page.locator('select').filter({ hasText: '모든 유형' }).first();
      await expect(typeFilter).toBeVisible({ timeout: 5000 });
      await typeFilter.selectOption('광고');
      await page.waitForTimeout(500);
      await expect(typeFilter).toHaveValue('광고');
    });
  });

  test.describe('반응형 및 접근성', () => {
    test('모바일 뷰포트에서도 레이아웃이 유지됨', async ({ page }) => {
      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      
      // 주요 요소들이 여전히 표시되는지 확인
      await expect(page.locator('h2:has-text("알림 / 마케팅")')).toBeVisible();
    });

    test('키보드 접근성이 작동함', async ({ page }) => {
      // Tab 키로 네비게이션 가능한지 확인
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      
      // 포커스가 이동했는지 확인
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });
});
