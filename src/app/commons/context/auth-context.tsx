'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, AdminInfo } from '../types/auth';
import { tokenStorage } from '../utils/token-storage';
import { login as loginAPI, logout as logoutAPI } from '../apis/admin';
import { getInquirySocketClient } from '../apis/inquiry/socket';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    admin: null,
    isLoading: true,
    error: null,
  });

  // 초기 로드 시 저장된 세션 확인 (세션 지속성 체크)
  useEffect(() => {
    const session = tokenStorage.get();
    if (session?.admin && session?.accessToken) {
      setState({
        isAuthenticated: true,
        admin: session.admin,
        isLoading: false,
        error: null,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
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

        // 로그인 후 소켓 재인증 (토큰 업데이트)
        try {
          const socketClient = getInquirySocketClient();
          await socketClient.updateToken(response.accessToken);
          console.log('[Auth] 로그인 후 소켓 재인증 완료');
        } catch (socketError) {
          console.error('[Auth] 소켓 재인증 실패:', socketError);
          // 소켓 오류는 치명적이지 않으므로 로그인 실패로 처리하지 않음
        }
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
      // 소켓 연결 해제
      try {
        const socketClient = getInquirySocketClient();
        socketClient.disconnect();
        console.log('[Auth] 로그아웃 후 소켓 연결 해제 완료');
      } catch (socketError) {
        console.error('[Auth] 소켓 연결 해제 실패:', socketError);
      }

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
