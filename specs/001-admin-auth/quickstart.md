# Quick Start: 관리자 로그인 기능 개발

**Feature**: 관리자 로그인  
**Date**: 2025-01-19

## 개요

이 문서는 관리자 로그인 기능을 구현하기 위한 빠른 시작 가이드입니다.

## 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- 백엔드 API 서버 실행 중
- 환경 변수 설정 (`.env.local`)

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# 또는 프로덕션 URL
```

## 구현 단계

### 1. 토큰 저장 유틸리티 생성

**파일**: `src/app/commons/utils/token-storage.ts`

```typescript
import { AuthSession } from '../types/auth';

const STORAGE_KEY = 'admin_auth_session';

export const tokenStorage = {
  get: (): AuthSession | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },
  
  set: (session: AuthSession): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  },
  
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },
};
```

### 2. 인증 컨텍스트 생성

**파일**: `src/app/commons/context/auth-context.tsx`

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, AdminInfo } from '../types/auth';
import { tokenStorage } from '../utils/token-storage';
import { login as loginAPI, logout as logoutAPI } from '../apis/admin';

const AuthContext = createContext<AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
} | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    admin: null,
    isLoading: true,
    error: null,
  });

  // 초기 로드 시 저장된 세션 확인
  useEffect(() => {
    const session = tokenStorage.get();
    if (session?.admin) {
      setState({
        isAuthenticated: true,
        admin: session.admin,
        isLoading: false,
        error: null,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await loginAPI({ email, password });
      if (response.accessToken && response.refreshToken && response.admin) {
        const session = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          admin: response.admin,
        };
        tokenStorage.set(session);
        setState({
          isAuthenticated: true,
          admin: response.admin,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error('로그인 응답에 필요한 정보가 없습니다');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다';
      setState({
        isAuthenticated: false,
        admin: null,
        isLoading: false,
        error: message,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenStorage.remove();
      setState({
        isAuthenticated: false,
        admin: null,
        isLoading: false,
        error: null,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 3. API 클라이언트에 토큰 인터셉터 추가

**파일**: `src/app/commons/provider/api-provider/api-client.ts`

기존 요청 인터셉터를 수정:

```typescript
// 요청 인터셉터
this.axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 토큰 추가
    if (typeof window !== 'undefined') {
      const session = tokenStorage.get();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터에 토큰 갱신 로직 추가
this.axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: unknown) => {
    const originalRequest = error.config;
    
    // 401 에러이고 토큰 갱신이 아직 시도되지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const session = tokenStorage.get();
        if (session?.refreshToken) {
          // 토큰 갱신 API 호출
          const response = await axios.post(`${API_BASE_URL}/api/admin/auth/refresh`, {
            refreshToken: session.refreshToken,
          });
          
          // 새 토큰 저장
          const newSession = {
            ...session,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken || session.refreshToken,
          };
          tokenStorage.set(newSession);
          
          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`;
          return this.axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃 처리
        tokenStorage.remove();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    console.error('API request failed:', error);
    return Promise.reject(error);
  }
);
```

### 4. LoginPage 컴포넌트 수정

**파일**: `src/app/components/LoginPage/index.tsx`

```typescript
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../commons/context/auth-context';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success('로그인 성공');
      router.push('/dashboard');
    } catch (err) {
      toast.error(error || '로그인에 실패했습니다');
    }
  };

  return (
    <div className={styles.login_container}>
      {/* 기존 JSX 유지, form에 handleSubmit 연결 */}
      <form onSubmit={handleSubmit(onSubmit)} className={styles.login_form}>
        {/* ... */}
      </form>
    </div>
  );
}
```

### 5. 루트 레이아웃에 AuthProvider 추가

**파일**: `src/app/layout.tsx` 또는 `src/app/page.tsx`

```typescript
import { AuthProvider } from './commons/context/auth-context';

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

### 6. 인증 가드 추가

**파일**: `src/app/page.tsx`

```typescript
'use client';
import { useEffect } from 'react';
import { useAuth } from './commons/context/auth-context';
import { LoginPage } from './components/LoginPage';
import { DashboardOverview } from './components/DashboardOverview';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <DashboardOverview />;
}
```

## 타입 정의

**파일**: `src/app/commons/types/auth.ts`

```typescript
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}

export interface AdminInfo {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  admin: AdminInfo;
}

export interface AuthState {
  isAuthenticated: boolean;
  admin: AdminInfo | null;
  isLoading: boolean;
  error: string | null;
}
```

## 테스트

### E2E 테스트 예시

**파일**: `src/app/tests/api-tests/admin-test/login.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('관리자 로그인 성공', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('text=관리자')).toBeVisible();
});
```

## 다음 단계

1. 에러 처리 개선
2. 로딩 상태 UI 개선
3. 토큰 만료 시간 설정
4. 자동 로그아웃 기능
5. 보안 강화 (CSRF 토큰 등)

## 참고 자료

- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [React Hook Form 문서](https://react-hook-form.com/)
- [Axios 인터셉터](https://axios-http.com/docs/interceptors)
- [OpenAPI 스펙](./contracts/admin-auth-api.yaml)
