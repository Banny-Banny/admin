'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Calendar, User, ArrowLeft, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { getNotices, getNoticeById, createNotice, updateNotice } from '../../commons/apis/notice';
import type { NoticeListItem, Notice as ApiNotice } from '../../commons/apis/notice';
import { useDebounce } from '../../commons/hooks/use-debounce';
import { handleApiErrorWithToast } from '../../commons/utils/error-handler';
import styles from "./styles.module.css";

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

// API NoticeListItem을 UI Notice로 변환하는 헬퍼 함수
function mapApiNoticeToUiNotice(apiNotice: NoticeListItem, index: number): Notice {
  // UUID를 간단한 숫자로 변환 (해시 함수 사용)
  const hashId = apiNotice.id.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const numericId = Math.abs(hashId) % 1000000; // 0-999999 범위로 제한

  return {
    id: numericId,
    originalId: apiNotice.id, // 원본 UUID 저장 (상세 조회용)
    title: apiNotice.title,
    content: '', // 목록에서는 content가 없으므로 빈 문자열
    author: '관리자', // UI 전용 필드
    createdAt: apiNotice.createdAt.split('T')[0], // ISO 날짜를 YYYY-MM-DD 형식으로 변환
    views: 0, // UI 전용 필드 (기본값 0)
    isPinned: apiNotice.isPinned,
  };
}

// API Notice를 UI Notice로 변환하는 헬퍼 함수 (상세 조회용)
function mapApiNoticeDetailToUiNotice(apiNotice: ApiNotice): Notice {
  // UUID를 간단한 숫자로 변환 (해시 함수 사용)
  const hashId = apiNotice.id.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const numericId = Math.abs(hashId) % 1000000; // 0-999999 범위로 제한

  return {
    id: numericId,
    originalId: apiNotice.id, // 원본 UUID 저장
    title: apiNotice.title,
    content: apiNotice.content, // 상세 조회에서는 content가 있음
    author: '관리자', // UI 전용 필드
    createdAt: apiNotice.createdAt.split('T')[0], // ISO 날짜를 YYYY-MM-DD 형식으로 변환
    views: 0, // UI 전용 필드 (기본값 0)
    isPinned: apiNotice.isPinned,
  };
}

export function ReportsPage() {
  const [view, setView] = useState<'list' | 'detail' | 'write' | 'edit'>('list');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; content?: string }>({});

  // Debounce search term to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // API에서 공지사항 목록 조회
  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getNotices({
          search: debouncedSearchTerm || undefined,
          limit: 100, // 충분히 큰 값으로 설정하여 모든 공지사항 조회
          offset: 0,
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
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [debouncedSearchTerm]);

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
      // 404 에러 처리
      if (err.response?.status === 404) {
        const errorMessage = '공지사항을 찾을 수 없습니다.';
        setDetailError(errorMessage);
        handleApiErrorWithToast(err, errorMessage);
      } else {
        const apiError = handleApiErrorWithToast(err, '공지사항 상세 정보를 불러오는데 실패했습니다.');
        setDetailError(apiError.message);
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
          const listResponse = await getNotices({
            search: debouncedSearchTerm || undefined,
            limit: 100,
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
          // 성공 시 목록 새로고침
          const listResponse = await getNotices({
            search: debouncedSearchTerm || undefined,
            limit: 100,
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
      handleApiErrorWithToast(err, errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      // TODO: Phase 5에서 API 연동 예정
      setNotices(notices.filter((notice) => notice.id !== id));
      setView('list');
      toast.success('공지사항이 삭제되었습니다.');
    }
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
              <div className={styles.c_g9tmm}>
                공지사항을 불러오는 중...
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
                      <p className={styles.c_16wgd3u}>
                        {/* 목록에서는 content 미표시 */}
                      </p>
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
            <div className={styles.c_g9tmm}>
              공지사항을 불러오는 중...
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
                          handleApiErrorWithToast(err, '공지사항 정보를 불러오는데 실패했습니다.');
                        } finally {
                          setSubmitLoading(false);
                        }
                      }}
                      className={styles.c_jiqtbf}
                      style={{ backgroundColor: '#3b82f6' }}
                      disabled={submitLoading}
                    >
                      <Edit size={18} />
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(selectedNotice.id)}
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
