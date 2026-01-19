import { AuthSession } from '../types/auth';

const STORAGE_KEY = 'admin_auth_session';

export const tokenStorage = {
  /**
   * 저장된 인증 세션을 가져옵니다.
   * @returns 인증 세션 또는 null
   */
  get: (): AuthSession | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to parse stored session:', error);
      return null;
    }
  },

  /**
   * 인증 세션을 저장합니다.
   * @param session 저장할 인증 세션
   */
  set: (session: AuthSession): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  },

  /**
   * 저장된 인증 세션을 삭제합니다.
   */
  remove: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove session:', error);
    }
  },
};
