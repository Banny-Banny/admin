'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Calendar, User, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getNotices } from '../../commons/apis/notice';
import type { NoticeListItem } from '../../commons/apis/notice';
import { useDebounce } from '../../commons/hooks/use-debounce';
import { handleApiErrorWithToast } from '../../commons/utils/error-handler';
import styles from "./styles.module.css";

// UI용 Notice 인터페이스 (API 데이터 + UI 전용 필드)
interface Notice {
  id: number; // API의 string id를 number로 변환 (간단한 해시 사용)
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
    title: apiNotice.title,
    content: '', // 목록에서는 content가 없으므로 빈 문자열
    author: '관리자', // UI 전용 필드
    createdAt: apiNotice.createdAt.split('T')[0], // ISO 날짜를 YYYY-MM-DD 형식으로 변환
    views: 0, // UI 전용 필드 (기본값 0)
    isPinned: apiNotice.isPinned,
  };
}

export function ReportsPage() {
  const [view, setView] = useState<'list' | 'detail' | 'write'>('list');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

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

  const handleNoticeClick = (notice: Notice) => {
    // 조회수 증가 (UI 전용)
    const updatedNotices = notices.map((n) =>
      n.id === notice.id ? { ...n, views: n.views + 1 } : n
    );
    setNotices(updatedNotices);
    setSelectedNotice({ ...notice, views: notice.views + 1 });
    setView('detail');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Phase 5에서 API 연동 예정
    const newNotice: Notice = {
      id: notices.length + 1,
      title: formData.title,
      content: formData.content,
      author: '관리자',
      createdAt: new Date().toISOString().split('T')[0],
      views: 0,
      isPinned: formData.isPinned,
    };

    setNotices([newNotice, ...notices]);
    setFormData({ title: '', content: '', isPinned: false });
    setView('list');
    toast.success('공지사항이 등록되었습니다.');
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
    isPinned: false,
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
  if (view === 'detail' && selectedNotice) {
    return (
      <div className={styles.c_1j8i8bf}>
        <button
          onClick={() => setView('list')}
          className={styles.c_1repdhl}
        >
          <ArrowLeft size={20} />
          목록으로 돌아가기
        </button>

        <div className={styles.c_4rnbt2}>
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
              <button
                onClick={() => handleDelete(selectedNotice.id)}
                className={styles.c_jiqtbf}
              >
                <Trash2 size={18} />
                삭제
              </button>
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
        </div>

        <div className={styles.c_xeice1}>
          <button
            onClick={() => setView('list')}
            className={styles.c_1v6b9ss}
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  // 작성 뷰
  if (view === 'write') {
    return (
      <div className={styles.c_1j8i8bf}>
        <button
          onClick={() => setView('list')}
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
                />
                <span className={styles.c_1my1zyy}>
                  상단 고정 (중요 공지)
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="공지사항 제목을 입력하세요"
                className={styles.c_1gzwh21}
              />
            </div>

            <div>
              <label className={styles.c_a41skz}>
                내용 <span className={styles.c_uurwux}>*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={12}
                placeholder="공지사항 내용을 입력하세요"
                className={styles.c_1j5q06i}
              />
            </div>

            <div className={styles.c_sm9r4r}>
              <button
                type="button"
                onClick={() => setView('list')}
                className={styles.c_8zbzmp}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.c_b151g0}
              >
                작성 완료
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
