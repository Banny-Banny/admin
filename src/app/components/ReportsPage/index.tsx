'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Calendar, User, ArrowLeft, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { getNotices, getNoticeById, createNotice, updateNotice, deleteNotice } from '../../commons/apis/notice';
import type { NoticeListItem, Notice as ApiNotice } from '../../commons/apis/notice';
import { useDebounce } from '../../commons/hooks/use-debounce';
import { handleApiErrorWithToast, handleApiError } from '../../commons/utils/error-handler';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../../commons/components/alert-dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from "./styles.module.css";

// 페이지네이션 상수
const NOTICES_PER_PAGE = 10;

// UI용 Notice 인터페이스 (API 데이터 + UI 전용 필드)
interface Notice {
  id: number; // API의 string id를 number로 변환 (간단한 해시 사용)
  originalId: string; // API의 원본 UUID (상세 조회용)
  title: string;
  content: string; // 목록에서는 표시하지 않지만, 상세 뷰를 위해 저장
  author: string; // UI 전용 필드 (API에 없음)
  createdAt: string;
  views: number; // UI 전용 필드 (API에 없음)
  isPinned: boolean;
}

/**
 * API NoticeListItem을 UI Notice로 변환하는 헬퍼 함수
 * @param apiNotice - API에서 받은 공지사항 목록 항목
 * @returns UI에서 사용할 Notice 객체
 */
function mapApiNoticeToUiNotice(apiNotice: NoticeListItem): Notice {
  // UUID를 간단한 숫자로 변환 (해시 함수 사용)
  const hashId = apiNotice.id.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const numericId = Math.abs(hashId) % 1000000;

  return {
    id: numericId,
    originalId: apiNotice.id,
    title: apiNotice.title,
    content: '',
    author: '관리자',
    createdAt: apiNotice.createdAt.split('T')[0],
    views: 0,
    isPinned: apiNotice.isPinned,
  };
}

/**
 * API Notice를 UI Notice로 변환하는 헬퍼 함수 (상세 조회용)
 * @param apiNotice - API에서 받은 공지사항 상세 정보
 * @returns UI에서 사용할 Notice 객체
 */
function mapApiNoticeDetailToUiNotice(apiNotice: ApiNotice): Notice {
  // UUID를 간단한 숫자로 변환 (해시 함수 사용)
  const hashId = apiNotice.id.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const numericId = Math.abs(hashId) % 1000000;

  return {
    id: numericId,
    originalId: apiNotice.id,
    title: apiNotice.title,
    content: apiNotice.content,
    author: '관리자',
    createdAt: apiNotice.createdAt.split('T')[0],
    views: 0,
    isPinned: apiNotice.isPinned,
  };
}

/**
 * 공지사항 관리 페이지 컴포넌트
 * 
 * 관리자가 공지사항을 조회, 작성, 수정, 삭제할 수 있는 페이지입니다.
 * 
 * 주요 기능:
 * - 공지사항 목록 조회 및 검색
 * - 공지사항 상세 조회
 * - 공지사항 작성
 * - 공지사항 수정
 * - 공지사항 삭제
 * - 페이지네이션 지원
 * 
 * @returns 공지사항 관리 페이지 JSX
 */
export function ReportsPage() {
  const [view, setView] = useState<'list' | 'detail' | 'write' | 'edit'>('list');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; content?: string }>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 검색어 debounce 처리 (300ms 지연)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 검색어가 변경되면 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // API에서 공지사항 목록 조회
  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      setError(null);

      try {
        const calculatedOffset = (currentPage - 1) * NOTICES_PER_PAGE;
        const response = await getNotices({
          search: debouncedSearchTerm || undefined,
          limit: NOTICES_PER_PAGE,
          offset: calculatedOffset,
        });

        if (response.success && response.data) {
          // API 데이터를 UI Notice로 변환
          const mappedNotices = response.data.items.map(mapApiNoticeToUiNotice);
          
          // 고정 공지사항을 상단에 배치하고, 그 다음 최신순으로 정렬
          const sortedNotices = [...mappedNotices].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // 최신순 정렬 (createdAt 기준)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

          setNotices(sortedNotices);
          setTotal(response.data.total);
        } else {
          throw new Error('공지사항 목록을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        const apiError = handleApiErrorWithToast(err, '공지사항 목록을 불러오는데 실패했습니다.');
        setError(apiError.message);
        setNotices([]);
        setTotal(0);
        
        // 네트워크 에러인 경우 추가 안내
        if (apiError.isNetworkError) {
          console.error('[ReportsPage] 네트워크 오류:', err);
        }
        // 인증 에러인 경우 (401) - apiClient에서 이미 처리되지만 로깅
        if (apiError.isAuthError) {
          console.error('[ReportsPage] 인증 오류:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [debouncedSearchTerm, currentPage]);

  // 페이지 변경 핸들러
  const goToPage = (page: number) => {
    const totalPages = Math.ceil(total / NOTICES_PER_PAGE);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // 페이지 변경 시 스크롤을 맨 위로 이동
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(total / NOTICES_PER_PAGE);
  const startIndex = (currentPage - 1) * NOTICES_PER_PAGE;
  const endIndex = Math.min(startIndex + NOTICES_PER_PAGE, total);

  const handleNoticeClick = async (notice: Notice) => {
    // 조회수 증가 (UI 전용)
    const updatedNotices = notices.map((n) =>
      n.id === notice.id ? { ...n, views: n.views + 1 } : n
    );
    setNotices(updatedNotices);

    // 상세 뷰로 전환
    setView('detail');
    setDetailLoading(true);
    setDetailError(null);
    setSelectedNotice({ ...notice, views: notice.views + 1 });

    try {
      // API에서 상세 정보 조회
      const response = await getNoticeById(notice.originalId);

      if (response.success && response.data) {
        // API 데이터를 UI Notice로 변환
        const detailNotice = mapApiNoticeDetailToUiNotice(response.data);
        // 조회수는 기존 값 유지
        detailNotice.views = notice.views + 1;
        setSelectedNotice(detailNotice);
      } else {
        throw new Error('공지사항 상세 정보를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      const apiError = handleApiError(err);
      
      // 404 에러 처리
      if (apiError.isNotFound) {
        const errorMessage = '공지사항을 찾을 수 없습니다.';
        setDetailError(errorMessage);
        toast.error(errorMessage);
      } else {
        // 네트워크 에러 또는 기타 에러
        handleApiErrorWithToast(err, '공지사항 상세 정보를 불러오는데 실패했습니다.');
        setDetailError(apiError.message);
        
        // 네트워크 에러인 경우 추가 안내
        if (apiError.isNetworkError) {
          console.error('[ReportsPage] 네트워크 오류:', err);
        }
        // 인증 에러인 경우 (401) - apiClient에서 이미 처리되지만 로깅
        if (apiError.isAuthError) {
          console.error('[ReportsPage] 인증 오류:', err);
        }
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 검증
    const errors: { title?: string; content?: string } = {};
    if (!formData.title.trim()) {
      errors.title = '제목을 입력해주세요.';
    }
    if (!formData.content.trim()) {
      errors.content = '내용을 입력해주세요.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSubmitLoading(true);

    try {
      // 수정 모드인 경우
      if (view === 'edit' && editingNoticeId) {
        const response = await updateNotice(editingNoticeId, {
          title: formData.title.trim(),
          content: formData.content.trim(),
          imageUrl: formData.imageUrl.trim() || undefined,
          isPinned: formData.isPinned,
          isVisible: formData.isVisible,
        });

        if (response.success) {
          // 목록 새로고침
          const calculatedOffset = (currentPage - 1) * NOTICES_PER_PAGE;
          const listResponse = await getNotices({
            search: debouncedSearchTerm || undefined,
            limit: NOTICES_PER_PAGE,
            offset: calculatedOffset,
          });

          if (listResponse.success && listResponse.data) {
            const mappedNotices = listResponse.data.items.map(mapApiNoticeToUiNotice);
            const sortedNotices = [...mappedNotices].sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            setNotices(sortedNotices);
            setTotal(listResponse.data.total);
          }

          // 상세 뷰 업데이트
          if (selectedNotice) {
            const detailResponse = await getNoticeById(editingNoticeId);
            if (detailResponse.success && detailResponse.data) {
              const updatedNotice = mapApiNoticeDetailToUiNotice(detailResponse.data);
              updatedNotice.views = selectedNotice.views; // 조회수 유지
              setSelectedNotice(updatedNotice);
            }
          }

          // 수정 모드 종료 및 상세 뷰로 이동
          setEditingNoticeId(null);
          setFormData({ title: '', content: '', imageUrl: '', isPinned: false, isVisible: true });
          setView('detail');
          toast.success('공지사항이 수정되었습니다.');
        } else {
          throw new Error('공지사항 수정에 실패했습니다.');
        }
      } else {
        // 작성 모드인 경우
        const response = await createNotice({
          title: formData.title.trim(),
          content: formData.content.trim(),
          imageUrl: formData.imageUrl.trim() || undefined,
          isPinned: formData.isPinned,
          isVisible: formData.isVisible,
        });

        if (response.success && response.data) {
          // 성공 시 목록 새로고침 (새 공지사항이 추가되므로 첫 페이지로)
          setCurrentPage(1);
          const listResponse = await getNotices({
            search: debouncedSearchTerm || undefined,
            limit: NOTICES_PER_PAGE,
            offset: 0,
          });

          if (listResponse.success && listResponse.data) {
            const mappedNotices = listResponse.data.items.map(mapApiNoticeToUiNotice);
            const sortedNotices = [...mappedNotices].sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            setNotices(sortedNotices);
            setTotal(listResponse.data.total);
          }

          // 폼 초기화 및 목록으로 이동
          setFormData({ title: '', content: '', imageUrl: '', isPinned: false, isVisible: true });
          setView('list');
          toast.success('공지사항이 등록되었습니다.');
        } else {
          throw new Error('공지사항 등록에 실패했습니다.');
        }
      }
    } catch (err) {
      const errorMessage = view === 'edit' ? '공지사항 수정에 실패했습니다.' : '공지사항 등록에 실패했습니다.';
      const apiError = handleApiErrorWithToast(err, errorMessage);
      
      // 네트워크 에러인 경우 추가 안내
      if (apiError.isNetworkError) {
        console.error('[ReportsPage] 네트워크 오류:', err);
      }
      // 인증 에러인 경우 (401) - apiClient에서 이미 처리되지만 로깅
      if (apiError.isAuthError) {
        console.error('[ReportsPage] 인증 오류:', err);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = () => {
    // 삭제 확인 다이얼로그 열기
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedNotice) return;

    setIsDeleting(true);
    try {
      const response = await deleteNotice(selectedNotice.originalId);

      if (response.success) {
        // 삭제 후 현재 페이지의 마지막 항목이 삭제된 경우 이전 페이지로 이동
        const currentPageItemCount = notices.length;
        let newPage = currentPage;
        if (currentPageItemCount === 1 && currentPage > 1) {
          // 현재 페이지에 항목이 1개뿐이고 첫 페이지가 아니면 이전 페이지로
          newPage = Math.max(1, currentPage - 1);
          setCurrentPage(newPage);
        }

        // 목록 새로고침
        const newOffset = (newPage - 1) * NOTICES_PER_PAGE;
        const listResponse = await getNotices({
          search: debouncedSearchTerm || undefined,
          limit: NOTICES_PER_PAGE,
          offset: newOffset,
        });

        if (listResponse.success && listResponse.data) {
          const mappedNotices = listResponse.data.items.map(mapApiNoticeToUiNotice);
          const sortedNotices = [...mappedNotices].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setNotices(sortedNotices);
          setTotal(listResponse.data.total);
        }

        // 다이얼로그 닫기 및 목록 뷰로 이동
        setShowDeleteDialog(false);
        setSelectedNotice(null);
        setView('list');
        toast.success('공지사항이 삭제되었습니다.');
      } else {
        throw new Error('공지사항 삭제에 실패했습니다.');
      }
    } catch (err) {
      const apiError = handleApiErrorWithToast(err, '공지사항 삭제에 실패했습니다.');
      
      // 네트워크 에러인 경우 추가 안내
      if (apiError.isNetworkError) {
        console.error('[ReportsPage] 네트워크 오류:', err);
      }
      // 인증 에러인 경우 (401) - apiClient에서 이미 처리되지만 로깅
      if (apiError.isAuthError) {
        console.error('[ReportsPage] 인증 오류:', err);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    isPinned: false,
    isVisible: true,
  });

  // 목록 뷰
  if (view === 'list') {
    return (
      <div className={styles.c_1j8i8bf}>
        <div className={styles.c_xc8ak4}>
          <div>
            <h2 className={styles.c_1dlkxbt}>공지사항</h2>
            <p className={styles.c_9ngaqo}>전체 {total}개의 공지사항</p>
          </div>
          <button
            onClick={() => setView('write')}
            className={styles.c_1kx26xi}
          >
            <Plus size={20} />
            공지사항 작성
          </button>
        </div>

        <div className={styles.c_4rnbt2}>
          <div className={styles.c_65x7hk}>
            <div className={styles.c_1pv0ki4}>
              <Search className={styles.c_1y94mk} size={20} />
              <input
                type="text"
                placeholder="제목이나 내용으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.c_lwq1hq}
              />
            </div>
          </div>

          <div className={styles.c_fyf4x}>
            {loading ? (
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>공지사항을 불러오는 중...</p>
              </div>
            ) : error ? (
              <div className={styles.c_g9tmm}>
                {error}
              </div>
            ) : notices.length > 0 ? (
              notices.map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => handleNoticeClick(notice)}
                  className={`${styles.noticeItem} ${
                    notice.isPinned ? styles.noticePinned : ''
                  }`}
                >
                  <div className={styles.c_oi2yba}>
                    <div className={styles.c_1dzu82l}>
                      <div className={styles.c_5znanq}>
                        {notice.isPinned && (
                          <span className={styles.c_zxbkcz}>
                            공지
                          </span>
                        )}
                        <h3 className={styles.c_1riaao0}>
                          {notice.title}
                        </h3>
                      </div>
                      <p className={styles.c_16wgd3u}></p>
                      <div className={styles.c_kso4az}>
                        <div className={styles.c_2ca09v}>
                          <User size={14} />
                          <span>{notice.author}</span>
                        </div>
                        <div className={styles.c_2ca09v}>
                          <Calendar size={14} />
                          <span>{notice.createdAt}</span>
                        </div>
                        <div className={styles.c_2ca09v}>
                          <Eye size={14} />
                          <span>{notice.views.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.c_g9tmm}>
                공지사항이 없습니다.
              </div>
            )}
          </div>

          {/* 페이지네이션 */}
          {!loading && !error && totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginTop: '24px',
              padding: '16px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                전체 {total}개 중 {startIndex + 1}-{endIndex}개 표시
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ChevronLeft size={16} />
                  이전
                </button>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // 현재 페이지 주변 2페이지씩만 표시
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: currentPage === page ? '#3b82f6' : 'white',
                            color: currentPage === page ? 'white' : '#374151',
                            cursor: 'pointer',
                            minWidth: '40px',
                          }}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
                      return (
                        <span key={page} style={{ padding: '8px 4px', color: '#6b7280' }}>
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  다음
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 상세 뷰
  if (view === 'detail') {
    return (
      <div className={styles.c_1j8i8bf}>
        <button
          onClick={() => {
            setView('list');
            setDetailError(null);
            setSelectedNotice(null);
          }}
          className={styles.c_1repdhl}
        >
          <ArrowLeft size={20} />
          목록으로 돌아가기
        </button>

        <div className={styles.c_4rnbt2}>
          {detailLoading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>공지사항을 불러오는 중...</p>
            </div>
          ) : detailError ? (
            <div className={styles.c_g9tmm}>
              {detailError}
            </div>
          ) : selectedNotice ? (
            <>
              <div className={styles.c_1yp1bvq}>
                <div className={styles.c_9rc2p2}>
                  <div className={styles.c_1dzu82l}>
                    {selectedNotice.isPinned && (
                      <span className={styles.c_1wuo00e}>
                        공지
                      </span>
                    )}
                    <h1 className={styles.c_1wgto1v}>
                      {selectedNotice.title}
                    </h1>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={async () => {
                        // 수정 모드로 전환: API에서 최신 상세 정보 불러오기
                        setEditingNoticeId(selectedNotice.originalId);
                        setFormErrors({});
                        setSubmitLoading(true);

                        try {
                          const detailResponse = await getNoticeById(selectedNotice.originalId);
                          if (detailResponse.success && detailResponse.data) {
                            const noticeDetail = detailResponse.data;
                            setFormData({
                              title: noticeDetail.title,
                              content: noticeDetail.content,
                              imageUrl: noticeDetail.imageUrl || '',
                              isPinned: noticeDetail.isPinned,
                              isVisible: noticeDetail.isVisible,
                            });
                            setView('edit');
                          } else {
                            throw new Error('공지사항 정보를 불러오는데 실패했습니다.');
                          }
                        } catch (err) {
                          const apiError = handleApiErrorWithToast(err, '공지사항 정보를 불러오는데 실패했습니다.');
                          
                          // 네트워크 에러인 경우 추가 안내
                          if (apiError.isNetworkError) {
                            console.error('[ReportsPage] 네트워크 오류:', err);
                          }
                          // 인증 에러인 경우 (401) - apiClient에서 이미 처리되지만 로깅
                          if (apiError.isAuthError) {
                            console.error('[ReportsPage] 인증 오류:', err);
                          }
                        } finally {
                          setSubmitLoading(false);
                        }
                      }}
                      className={styles.editButton}
                      disabled={submitLoading}
                    >
                      <Edit size={18} />
                      수정
                    </button>
                    <button
                      onClick={handleDelete}
                      className={styles.c_jiqtbf}
                    >
                      <Trash2 size={18} />
                      삭제
                    </button>
                  </div>
                </div>
                <div className={styles.c_1pyvd59}>
                  <div className={styles.c_2ca09w}>
                    <User size={16} />
                    <span>{selectedNotice.author}</span>
                  </div>
                  <div className={styles.c_2ca09w}>
                    <Calendar size={16} />
                    <span>{selectedNotice.createdAt}</span>
                  </div>
                  <div className={styles.c_2ca09w}>
                    <Eye size={16} />
                    <span>조회수 {selectedNotice.views.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className={styles.c_2c63}>
                <div className={styles.c_tgp36g}>
                  <div className={styles.c_gz1eh}>
                    {selectedNotice.content}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.c_g9tmm}>
              공지사항 정보를 불러올 수 없습니다.
            </div>
          )}
        </div>

        <div className={styles.c_xeice1}>
          <button
            onClick={() => {
              setView('list');
              setDetailError(null);
              setSelectedNotice(null);
            }}
            className={styles.c_1v6b9ss}
          >
            목록으로
          </button>
        </div>

        {/* 삭제 확인 다이얼로그 */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>공지사항 삭제 확인</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                {selectedNotice && (
                  <div style={{ marginTop: '8px', fontWeight: '500' }}>
                    제목: {selectedNotice.title}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
                취소
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                }}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // 수정 뷰
  if (view === 'edit') {
    return (
      <div className={styles.c_1j8i8bf}>
        <button
          onClick={() => {
            setView('detail');
            setEditingNoticeId(null);
            setFormData({ title: '', content: '', imageUrl: '', isPinned: false, isVisible: true });
            setFormErrors({});
          }}
          className={styles.c_1repdhl}
        >
          <ArrowLeft size={20} />
          상세로 돌아가기
        </button>

        <div className={styles.c_6422p}>
          <h2 className={styles.c_uoh44m}>공지사항 수정</h2>

          <form onSubmit={handleSubmit} className={styles.c_1j8i8bf}>
            <div>
              <label className={styles.c_5znans}>
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className={styles.c_sk3ga5}
                  disabled={submitLoading}
                />
                <span className={styles.c_1my1zyy}>
                  상단 고정 (중요 공지)
                </span>
              </label>
            </div>

            <div>
              <label className={styles.c_5znans}>
                <input
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                  className={styles.c_sk3ga5}
                  disabled={submitLoading}
                />
                <span className={styles.c_1my1zyy}>
                  공개 여부
                </span>
              </label>
            </div>

            <div>
              <label className={styles.c_a41skz}>
                제목 <span className={styles.c_uurwux}>*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (formErrors.title) {
                    setFormErrors({ ...formErrors, title: undefined });
                  }
                }}
                placeholder="공지사항 제목을 입력하세요"
                className={styles.c_1gzwh21}
                disabled={submitLoading}
              />
              {formErrors.title && (
                <div style={{ color: 'red', fontSize: '14px', marginTop: '4px' }}>
                  {formErrors.title}
                </div>
              )}
            </div>

            <div>
              <label className={styles.c_a41skz}>
                내용 <span className={styles.c_uurwux}>*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => {
                  setFormData({ ...formData, content: e.target.value });
                  if (formErrors.content) {
                    setFormErrors({ ...formErrors, content: undefined });
                  }
                }}
                rows={12}
                placeholder="공지사항 내용을 입력하세요"
                className={styles.c_1j5q06i}
                disabled={submitLoading}
              />
              {formErrors.content && (
                <div style={{ color: 'red', fontSize: '14px', marginTop: '4px' }}>
                  {formErrors.content}
                </div>
              )}
            </div>

            <div>
              <label className={styles.c_a41skz}>
                이미지 URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="이미지 URL을 입력하세요 (선택사항)"
                className={styles.c_1gzwh21}
                disabled={submitLoading}
              />
            </div>

            <div className={styles.c_sm9r4r}>
              <button
                type="button"
                onClick={() => {
                  setView('detail');
                  setEditingNoticeId(null);
                  setFormData({ title: '', content: '', imageUrl: '', isPinned: false, isVisible: true });
                  setFormErrors({});
                }}
                className={styles.c_8zbzmp}
                disabled={submitLoading}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.c_b151g0}
                disabled={submitLoading}
              >
                {submitLoading ? '수정 중...' : '수정 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 작성 뷰
  if (view === 'write') {
    return (
      <div className={styles.c_1j8i8bf}>
        <button
          onClick={() => {
            setView('list');
            setFormData({ title: '', content: '', imageUrl: '', isPinned: false, isVisible: true });
            setFormErrors({});
          }}
          className={styles.c_1repdhl}
        >
          <ArrowLeft size={20} />
          목록으로 돌아가기
        </button>

        <div className={styles.c_6422p}>
          <h2 className={styles.c_uoh44m}>공지사항 작성</h2>

          <form onSubmit={handleSubmit} className={styles.c_1j8i8bf}>
            <div>
              <label className={styles.c_5znans}>
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className={styles.c_sk3ga5}
                  disabled={submitLoading}
                />
                <span className={styles.c_1my1zyy}>
                  상단 고정 (중요 공지)
                </span>
              </label>
            </div>

            <div>
              <label className={styles.c_5znans}>
                <input
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                  className={styles.c_sk3ga5}
                  disabled={submitLoading}
                />
                <span className={styles.c_1my1zyy}>
                  공개 여부
                </span>
              </label>
            </div>

            <div>
              <label className={styles.c_a41skz}>
                제목 <span className={styles.c_uurwux}>*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (formErrors.title) {
                    setFormErrors({ ...formErrors, title: undefined });
                  }
                }}
                placeholder="공지사항 제목을 입력하세요"
                className={styles.c_1gzwh21}
                disabled={submitLoading}
              />
              {formErrors.title && (
                <div style={{ color: 'red', fontSize: '14px', marginTop: '4px' }}>
                  {formErrors.title}
                </div>
              )}
            </div>

            <div>
              <label className={styles.c_a41skz}>
                내용 <span className={styles.c_uurwux}>*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => {
                  setFormData({ ...formData, content: e.target.value });
                  if (formErrors.content) {
                    setFormErrors({ ...formErrors, content: undefined });
                  }
                }}
                rows={12}
                placeholder="공지사항 내용을 입력하세요"
                className={styles.c_1j5q06i}
                disabled={submitLoading}
              />
              {formErrors.content && (
                <div style={{ color: 'red', fontSize: '14px', marginTop: '4px' }}>
                  {formErrors.content}
                </div>
              )}
            </div>

            <div>
              <label className={styles.c_a41skz}>
                이미지 URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="이미지 URL을 입력하세요 (선택사항)"
                className={styles.c_1gzwh21}
                disabled={submitLoading}
              />
            </div>

            <div className={styles.c_sm9r4r}>
              <button
                type="button"
                onClick={() => {
                  setView('list');
                  setFormData({ title: '', content: '', imageUrl: '', isPinned: false, isVisible: true });
                  setFormErrors({});
                }}
                className={styles.c_8zbzmp}
                disabled={submitLoading}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.c_b151g0}
                disabled={submitLoading}
              >
                {submitLoading ? '등록 중...' : '작성 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
