import { AdminRole } from '../enums';

// 관리자 정보
export interface AdminInfo {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

// 인증 세션 (클라이언트 저장용)
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  admin: AdminInfo;
}

// 인증 상태 (Context에서 사용)
export interface AuthState {
  isAuthenticated: boolean;
  admin: AdminInfo | null;
  isLoading: boolean;
  error: string | null;
}
