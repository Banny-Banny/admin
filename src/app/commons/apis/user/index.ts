import { apiClient } from '../../provider/api-provider/api-client';

// ============================================================================
// 타입 정의
// ============================================================================

// 유저 상태
export type UserStatus = 'ALL' | 'ACTIVE' | 'INACTIVE';

// 유저 리스트 조회 요청 파라미터
export interface GetUsersParams {
  search?: string; // 검색어(닉네임/이메일)
  status?: UserStatus; // 유저 상태 (기본값: ALL)
  startDate?: string; // 시작 날짜
  endDate?: string; // 종료 날짜
  limit?: number; // 페이지 크기 (기본값: 20)
  offset?: number; // 페이지 오프셋 (기본값: 0)
}

// 유저 정보
export interface User {
  id: string;
  email: string;
  nickname?: string;
  name?: string;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

// 유저 리스트 조회 응답
export interface GetUsersResponse {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

// 유저 정보 수정 요청
export interface UpdateUserRequest {
  nickname?: string;
  email?: string;
  phoneNumber?: string;
  profileImg?: string;
  isMarketingAgreed?: boolean;
  isPushAgreed?: boolean;
}

// 유저 정보 수정 응답
export interface UpdateUserResponse {
  id: string;
  nickname?: string;
  email?: string;
  phoneNumber?: string;
  profileImg?: string;
  isMarketingAgreed?: boolean;
  isPushAgreed?: boolean;
  message?: string;
}

// ============================================================================
// API 함수
// ============================================================================

/**
 * 유저 리스트 조회
 * @param params 조회 파라미터 (검색어, 상태, 날짜 범위, 페이지네이션)
 * @returns 유저 리스트 및 페이지네이션 정보
 */
export async function getUsers(
  params?: GetUsersParams
): Promise<GetUsersResponse> {
  const queryParams = new URLSearchParams();

  if (params?.search) {
    queryParams.append('search', params.search);
  }
  if (params?.status && params.status !== 'ALL') {
    queryParams.append('status', params.status);
  }
  if (params?.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params?.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/users${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<GetUsersResponse>(endpoint);
}

/**
 * 유저 정보 수정
 * @param id 유저 ID
 * @param data 수정할 유저 정보
 * @returns 수정된 유저 정보
 */
export async function updateUser(
  id: string,
  data: UpdateUserRequest
): Promise<UpdateUserResponse> {
  return apiClient.post<UpdateUserResponse>(`/api/admin/users/${id}`, data);
}
