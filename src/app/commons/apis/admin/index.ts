import { apiClient } from '../../provider/api-provider/api-client';
import { AdminRole } from '../../enums';

// ============================================================================
// 타입 정의
// ============================================================================

// 관리자 계정 생성
export interface CreateAdminRequest {
  email: string;
  name: string;
  password: string;
}

export interface CreateAdminResponse {
  id?: string;
  email: string;
  name: string;
  message?: string;
}

// 관리자 로그인
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  admin?: {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
  };
  user?: {
    id: string;
    email: string;
    name: string;
  };
  message?: string;
}

// 관리자 프로필
export interface AdminProfileResponse {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt?: string;
  updatedAt?: string;
}

// 관리자 로그아웃
export interface LogoutResponse {
  message?: string;
}

// 관리자 목록 조회 파라미터
export interface GetAdminsParams {
  search?: string; // 검색어(이메일/이름)
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE'; // 상태 필터
  limit?: number; // 페이지 크기
  offset?: number; // 페이지 오프셋
}

// 관리자 목록 항목
export interface AdminListItem {
  id: string | number;
  email: string;
  name: string;
  role?: AdminRole;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

// 관리자 목록 조회 응답
export interface GetAdminsResponse {
  admins?: AdminListItem[];
  items?: AdminListItem[];
  total?: number;
  limit?: number;
  offset?: number;
}

// ============================================================================
// API 함수
// ============================================================================

/**
 * 관리자 계정 생성 (슈퍼 어드민 전용)
 * @param data 관리자 계정 정보
 * @returns 생성된 관리자 정보
 */
export async function createAdmin(
  data: CreateAdminRequest
): Promise<CreateAdminResponse> {
  return apiClient.post<CreateAdminResponse>('/api/admin/auth/admins', data);
}

/**
 * 관리자 로그인
 * @param data 로그인 정보 (이메일, 비밀번호)
 * @returns 로그인 성공 정보 (토큰, 사용자 정보)
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/api/admin/auth/login', data);
}

/**
 * 관리자 프로필 조회
 * @returns 현재 로그인한 관리자 프로필 정보
 */
export async function getAdminProfile(): Promise<AdminProfileResponse> {
  return apiClient.get<AdminProfileResponse>('/api/admin/auth/me');
}

/**
 * 관리자 로그아웃
 * @returns 로그아웃 성공 정보
 */
export async function logout(): Promise<LogoutResponse> {
  return apiClient.post<LogoutResponse>('/api/admin/auth/logout');
}

/**
 * 관리자 목록 조회
 * @param params 조회 파라미터 (검색어, 상태, 페이지네이션)
 * @returns 관리자 목록 및 페이지네이션 정보
 */
export async function getAdmins(
  params?: GetAdminsParams
): Promise<GetAdminsResponse> {
  const queryParams = new URLSearchParams();

  if (params?.search) {
    queryParams.append('search', params.search);
  }
  if (params?.status && params.status !== 'ALL') {
    queryParams.append('status', params.status);
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/admin${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<GetAdminsResponse>(endpoint);
}
