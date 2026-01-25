// ============================================================================
// 타입 정의
// ============================================================================

// 공지사항 엔티티 (상세 조회용)
export interface Notice {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  isPinned: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// 공지사항 목록 항목 (목록 조회용 축약 정보)
export interface NoticeListItem {
  id: string;
  title: string;
  imageUrl: string | null;
  isPinned: boolean;
  isVisible: boolean;
  createdAt: string;
}

// 공지사항 목록 응답
export interface NoticeListResponse {
  success: boolean;
  data: {
    items: NoticeListItem[];
    total: number;
    limit: number;
    offset: number;
  };
}

// 공지사항 상세 응답
export interface NoticeDetailResponse {
  success: boolean;
  data: Notice;
}

// 공지사항 등록 요청
export interface CreateNoticeRequest {
  title: string;
  content: string;
  image?: File;  // 파일 객체 추가
  imageUrl?: string;  // URL도 여전히 지원 (호환성)
  isPinned?: boolean;
  isVisible?: boolean;
}

// 공지사항 등록 응답
export interface CreateNoticeResponse {
  success: boolean;
  data: Notice;
}

// 공지사항 수정 요청
export interface UpdateNoticeRequest {
  title?: string;
  content?: string;
  image?: File;  // 파일 객체 추가
  imageUrl?: string;  // URL도 여전히 지원 (호환성)
  isPinned?: boolean;
  isVisible?: boolean;
}

// 공지사항 목록 조회 파라미터
export interface GetNoticesParams {
  search?: string;
  limit?: number;
  offset?: number;
}
