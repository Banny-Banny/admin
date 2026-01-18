import { useState } from 'react';
import { Plus, Search, Eye, Calendar, User, ArrowLeft, Trash2 } from 'lucide-react';
import styles from "./styles.module.css";

interface Notice {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  views: number;
  isPinned: boolean;
}

export function ReportsPage() {
  const [view, setView] = useState<'list' | 'detail' | 'write'>('list');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [notices, setNotices] = useState<Notice[]>([
    {
      id: 1,
      title: '[필독] 2026년 1월 시스템 업데이트 안내',
      content: '안녕하세요. 관리자입니다.\n\n2026년 1월 20일 새벽 2시부터 4시까지 시스템 정기 점검이 예정되어 있습니다.\n\n점검 시간 동안에는 일시적으로 서비스 이용이 제한될 수 있으니 양해 부탁드립니다.\n\n주요 업데이트 내용:\n- 보안 강화\n- 성능 개선\n- 새로운 기능 추가\n\n감사합니다.',
      author: '관리자',
      createdAt: '2026-01-15',
      views: 1247,
      isPinned: true,
    },
    {
      id: 2,
      title: '개인정보 처리방침 변경 안내',
      content: '개인정보 처리방침이 2026년 2월 1일부로 변경됩니다.\n\n주요 변경사항을 확인하시고, 궁금하신 점이 있으시면 고객센터로 문의해 주시기 바랍니다.\n\n변경된 내용은 홈페이지에서 확인하실 수 있습니다.',
      author: '운영팀',
      createdAt: '2026-01-12',
      views: 856,
      isPinned: false,
    },
    {
      id: 3,
      title: '신규 결제 시스템 도입',
      content: '더욱 편리한 결제를 위해 새로운 결제 시스템을 도입했습니다.\n\n카카오페이, 네이버페이, 토스 등 다양한 간편결제를 지원합니다.\n\n많은 이용 부탁드립니다.',
      author: '개발팀',
      createdAt: '2026-01-10',
      views: 632,
      isPinned: false,
    },
    {
      id: 4,
      title: '고객센터 운영시간 안내',
      content: '고객센터 운영시간을 안내드립니다.\n\n평일: 오전 9시 ~ 오후 6시\n주말 및 공휴일: 휴무\n\n긴급 문의는 이메일로 보내주시면 확인 후 답변드리겠습니다.',
      author: '고객지원팀',
      createdAt: '2026-01-08',
      views: 421,
      isPinned: false,
    },
    {
      id: 5,
      title: '설 연휴 배송 일정 안내',
      content: '설 연휴 기간 배송 일정을 안내드립니다.\n\n1월 27일 ~ 1월 30일: 배송 휴무\n1월 31일부터 정상 배송 시작\n\n미리 주문해 주시면 감사하겠습니다.',
      author: '물류팀',
      createdAt: '2026-01-05',
      views: 893,
      isPinned: false,
    },
  ]);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPinned: false,
  });

  const filteredNotices = notices.filter((notice) =>
    notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.id - a.id;
  });

  const handleNoticeClick = (notice: Notice) => {
    const updatedNotices = notices.map((n) =>
      n.id === notice.id ? { ...n, views: n.views + 1 } : n
    );
    setNotices(updatedNotices);
    setSelectedNotice({ ...notice, views: notice.views + 1 });
    setView('detail');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
  };

  const handleDelete = (id: number) => {
    if (confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      setNotices(notices.filter((notice) => notice.id !== id));
      setView('list');
    }
  };

  // 목록 뷰
  if (view === 'list') {
    return (
      <div className={styles.c_1j8i8bf}>
        <div className={styles.c_xc8ak4}>
          <div>
            <h2 className={styles.c_1dlkxbt}>공지사항</h2>
            <p className={styles.c_9ngaqo}>전체 {notices.length}개의 공지사항</p>
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
            {sortedNotices.length > 0 ? (
              sortedNotices.map((notice) => (
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
                        {notice.content}
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
