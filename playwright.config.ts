import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 로드
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright 설정 파일
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/app/tests',
  
  /* 테스트 실행 시 최대 시간 (30분) */
  timeout: 30 * 60 * 1000,
  
  /* 테스트 실패 시 재시도 횟수 */
  retries: process.env.CI ? 2 : 0,
  
  /* 병렬 실행할 워커 수 */
  workers: process.env.CI ? 1 : undefined,
  
  /* 테스트 리포트 설정 */
  reporter: 'html',
  
  /* 공유 설정 */
  use: {
    /* 기본 타임아웃 설정 */
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
    
    /* 스크린샷 설정 */
    screenshot: 'only-on-failure',
    
    /* 비디오 녹화 설정 */
    video: 'retain-on-failure',
    
    /* 트레이스 설정 */
    trace: 'on-first-retry',
    
    /* 기본 URL */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
  },

  /* 프로젝트별 브라우저 설정 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox와 WebKit은 브라우저 설치 후 활성화 가능
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // 모바일 테스트 (선택사항)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* 개발 서버 설정 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
