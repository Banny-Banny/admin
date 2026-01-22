import { AdminRole } from '../enums';
import { AdminInfo } from '../types/auth';

/**
 * 현재 관리자가 슈퍼 어드민인지 확인하는 헬퍼 함수
 * @param admin 관리자 정보 (null 가능)
 * @returns 슈퍼 어드민 여부
 */
export function isSuperAdmin(admin: AdminInfo | null): boolean {
  return admin?.role === AdminRole.SUPER_ADMIN;
}
