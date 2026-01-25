import { apiClient } from '../../provider/api-provider/api-client';
import type {
  Notice,
  NoticeListItem,
  NoticeListResponse,
  NoticeDetailResponse,
  CreateNoticeRequest,
  CreateNoticeResponse,
  UpdateNoticeRequest,
  GetNoticesParams,
} from './types';

// ============================================================================
// API 함수
// ============================================================================

/**
 * 공지사항 목록 조회 (공개 API)
 * 
 * 검색어와 페이지네이션을 사용하여 공지사항 목록을 조회합니다.
 * 인증 토큰이 필요하지 않은 공개 API입니다.
 * 
 * @param params - 검색, 페이지네이션 파라미터
 *   - search: 검색 키워드 (제목/본문) (선택)
 *   - limit: 페이지 크기 (기본값: 20) (선택)
 *   - offset: 페이지 오프셋 (기본값: 0) (선택)
 * @returns 공지사항 목록 응답 (items, total, limit, offset 포함)
 * @throws {AxiosError} API 요청 실패 시
 * 
 * @example
 * ```typescript
 * // 모든 공지사항 조회
 * const response = await getNotices();
 * 
 * // 검색어로 필터링
 * const response = await getNotices({ search: '시스템 업데이트' });
 * 
 * // 페이지네이션
 * const response = await getNotices({ limit: 10, offset: 20 });
 * ```
 */
export async function getNotices(
  params?: GetNoticesParams
): Promise<NoticeListResponse> {
  const queryParams = new URLSearchParams();

  if (params?.search) {
    queryParams.append('search', params.search);
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/notices${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<NoticeListResponse>(endpoint);
}

/**
 * 공지사항 상세 조회 (공개 API)
 * 
 * 공지사항 ID를 사용하여 특정 공지사항의 상세 정보를 조회합니다.
 * 인증 토큰이 필요하지 않은 공개 API입니다.
 * 
 * @param id - 공지사항 ID (UUID 형식)
 * @returns 공지사항 상세 응답 (Notice 객체 포함)
 * @throws {AxiosError} API 요청 실패 시 (404: 공지사항을 찾을 수 없음)
 * 
 * @example
 * ```typescript
 * const notice = await getNoticeById('d4079ee8-c33a-4587-84c3-4438f8efb095');
 * console.log(notice.data.title); // 공지사항 제목
 * ```
 */
export async function getNoticeById(id: string): Promise<NoticeDetailResponse> {
  return apiClient.get<NoticeDetailResponse>(`/api/notices/${id}`);
}

/**
 * 공지사항 등록 (관리자 API)
 * 
 * 새로운 공지사항을 등록합니다. 필수 필드(title, content)를 포함해야 합니다.
 * 관리자 인증 토큰이 필요합니다.
 * 
 * @param data - 공지사항 등록 요청 데이터
 *   - title: 공지사항 제목 (필수)
 *   - content: 공지사항 내용 (필수)
 *   - imageUrl: 이미지 URL (선택)
 *   - isPinned: 고정 여부 (선택, 기본값: false)
 *   - isVisible: 공개 여부 (선택, 기본값: true)
 * @returns 공지사항 등록 응답 (생성된 공지사항 정보)
 * @throws {AxiosError} API 요청 실패 시 (400: 검증 실패, 401: 인증 실패)
 * 
 * @example
 * ```typescript
 * const newNotice = await createNotice({
 *   title: '새 공지사항',
 *   content: '공지사항 내용입니다.',
 *   isPinned: false,
 *   isVisible: true,
 * });
 * ```
 */
export async function createNotice(
  data: CreateNoticeRequest
): Promise<CreateNoticeResponse> {
  const formData = new FormData();
  
  formData.append('title', data.title);
  formData.append('content', data.content);
  
  // 선택적 필드들
  // 파일 업로드 우선, 없으면 URL 사용
  if (data.image) {
    formData.append('image', data.image);
  } else if (data.imageUrl !== undefined) {
    formData.append('imageUrl', data.imageUrl);
  }
  
  if (data.isPinned !== undefined) {
    formData.append('isPinned', data.isPinned.toString());
  }
  if (data.isVisible !== undefined) {
    formData.append('isVisible', data.isVisible.toString());
  }
  
  return apiClient.post<CreateNoticeResponse>('/api/admin/notices', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 공지사항 정보 수정 (관리자 API)
 * 
 * 기존 공지사항의 정보를 부분 업데이트합니다. 변경하려는 필드만 포함하면 됩니다.
 * 관리자 인증 토큰이 필요합니다.
 * 
 * @param id - 공지사항 ID (UUID 형식)
 * @param data - 공지사항 수정 요청 데이터 (모든 필드 선택)
 *   - title: 공지사항 제목 (선택)
 *   - content: 공지사항 내용 (선택)
 *   - imageUrl: 이미지 URL (선택)
 *   - isPinned: 고정 여부 (선택)
 *   - isVisible: 공개 여부 (선택)
 * @returns 수정 성공 응답 (success: boolean)
 * @throws {AxiosError} API 요청 실패 시 (400: 검증 실패, 401: 인증 실패, 404: 공지사항을 찾을 수 없음)
 * 
 * @example
 * ```typescript
 * // 제목만 수정
 * await updateNotice('d4079ee8-c33a-4587-84c3-4438f8efb095', { title: '수정된 제목' });
 * 
 * // 여러 필드 수정
 * await updateNotice('d4079ee8-c33a-4587-84c3-4438f8efb095', {
 *   title: '수정된 제목',
 *   content: '수정된 내용',
 *   isPinned: true,
 * });
 * ```
 */
export async function updateNotice(
  id: string,
  data: UpdateNoticeRequest
): Promise<{ success: boolean }> {
  const formData = new FormData();
  
  // 필드가 존재하는 경우에만 추가
  if (data.title !== undefined) {
    formData.append('title', data.title);
  }
  if (data.content !== undefined) {
    formData.append('content', data.content);
  }
  
  // 파일 업로드 우선, 없으면 URL 사용
  if (data.image) {
    formData.append('image', data.image);
  } else if (data.imageUrl !== undefined) {
    formData.append('imageUrl', data.imageUrl || '');
  }
  
  if (data.isPinned !== undefined) {
    formData.append('isPinned', data.isPinned.toString());
  }
  if (data.isVisible !== undefined) {
    formData.append('isVisible', data.isVisible.toString());
  }
  
  return apiClient.patch<{ success: boolean }>(`/api/admin/notices/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 공지사항 삭제 (관리자 API)
 * 
 * 공지사항을 삭제합니다.
 * 관리자 인증 토큰이 필요합니다.
 * 
 * @param id - 공지사항 ID (UUID 형식)
 * @returns 삭제 성공 응답 (success: boolean)
 * @throws {AxiosError} API 요청 실패 시 (401: 인증 실패, 404: 공지사항을 찾을 수 없음)
 * 
 * @example
 * ```typescript
 * const result = await deleteNotice('d4079ee8-c33a-4587-84c3-4438f8efb095');
 * if (result.success) {
 *   console.log('공지사항이 삭제되었습니다.');
 * }
 * ```
 */
export async function deleteNotice(id: string): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/api/admin/notices/${id}`);
}
