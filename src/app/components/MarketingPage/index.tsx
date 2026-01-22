import { useState, useEffect } from 'react';
import { Send, Bell, Users, TrendingUp, Filter, Search } from 'lucide-react';
import styles from "./styles.module.css";

interface Message {
  id: number;
  title: string;
  content: string;
  type: '광고' | '안내' | '이벤트' | '업데이트';
  target: string;
  status: '발송완료' | '발송대기' | '예약';
  sentAt: string;
  recipients: number;
  openRate: number;
}

const STORAGE_KEY = 'marketing_messages';

// 초기 메시지 데이터
const initialMessages: Message[] = [
  {
    id: 1,
    title: '새해 특별 할인 이벤트',
    content: '새해를 맞아 전 상품 20% 할인! 지금 바로 확인하세요.',
    type: '광고',
    target: '전체 회원',
    status: '발송완료',
    sentAt: '2026-01-15 10:00',
    recipients: 1523,
    openRate: 45.2,
  },
  {
    id: 2,
    title: '시스템 점검 안내',
    content: '1월 20일 새벽 2시~4시 시스템 점검이 예정되어 있습니다.',
    type: '안내',
    target: '전체 회원',
    status: '발송완료',
    sentAt: '2026-01-14 15:30',
    recipients: 1523,
    openRate: 78.5,
  },
  {
    id: 3,
    title: '신규 기능 업데이트 알림',
    content: '새로운 기능이 추가되었습니다. 지금 확인해보세요!',
    type: '업데이트',
    target: '활성 회원',
    status: '발송완료',
    sentAt: '2026-01-12 14:00',
    recipients: 982,
    openRate: 62.3,
  },
  {
    id: 4,
    title: '설 연휴 이벤트',
    content: '설 연휴 특별 이벤트에 참여하세요!',
    type: '이벤트',
    target: '전체 회원',
    status: '예약',
    sentAt: '2026-01-25 09:00',
    recipients: 1523,
    openRate: 0,
  },
];

// localStorage에서 메시지 불러오기
const loadMessagesFromStorage = (): Message[] => {
  if (typeof window === 'undefined') return initialMessages;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialMessages;
    }
  } catch (error) {
    console.error('Failed to load messages from storage:', error);
  }
  return initialMessages;
};

// localStorage에 메시지 저장하기
const saveMessagesToStorage = (messages: Message[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save messages to storage:', error);
  }
};

export function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // localStorage에서 메시지 불러오기
  const [messages, setMessages] = useState<Message[]>(() => loadMessagesFromStorage());

  // messages가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    saveMessagesToStorage(messages);
  }, [messages]);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: '안내' as '광고' | '안내' | '이벤트' | '업데이트',
    target: '전체 회원',
    sendNow: true,
    scheduledDate: '',
    scheduledTime: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date();
    const sentAt = formData.sendNow
      ? `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`
      : `${formData.scheduledDate} ${formData.scheduledTime}`;

    const recipientCount = formData.target === '전체 회원' ? 1523 : formData.target === '활성 회원' ? 982 : 435;

    const newMessage: Message = {
      id: messages.length + 1,
      title: formData.title,
      content: formData.content,
      type: formData.type,
      target: formData.target,
      status: formData.sendNow ? '발송완료' : '예약',
      sentAt: sentAt,
      recipients: recipientCount,
      openRate: formData.sendNow ? Math.random() * 80 : 0,
    };

    setMessages([newMessage, ...messages]);
    setFormData({
      title: '',
      content: '',
      type: '안내',
      target: '전체 회원',
      sendNow: true,
      scheduledDate: '',
      scheduledTime: '',
    });
    
    alert(formData.sendNow ? '메시지가 발송되었습니다!' : '메시지가 예약되었습니다!');
    setActiveTab('history');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || message.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case '광고':
        return styles.typeAd;
      case '안내':
        return styles.typeInfo;
      case '이벤트':
        return styles.typeEvent;
      case '업데이트':
        return styles.typeUpdate;
      default:
        return styles.typeDefault;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '발송완료':
        return styles.statusSent;
      case '발송대기':
        return styles.statusPending;
      case '예약':
        return styles.statusScheduled;
      default:
        return styles.statusDefault;
    }
  };

  const getRateClass = (rate: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(rate)));
    return styles[`barWidth${clamped}` as keyof typeof styles];
  };

  const totalRecipients = messages.reduce((sum, msg) => sum + msg.recipients, 0);
  const averageOpenRate = messages.filter(m => m.openRate > 0).reduce((sum, msg) => sum + msg.openRate, 0) / messages.filter(m => m.openRate > 0).length || 0;

  return (
    <div className={styles.c_1j8i8bf}>
      <div>
        <h2 className={styles.c_1dlkxbt}>알림 / 마케팅</h2>
        <p className={styles.c_9ngaqo}>유저에게 메시지를 발송하고 관리하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className={styles.c_ittbg8}>
        <div className={styles.c_6422n}>
          <div className={styles.c_xc8ak4}>
            <div>
              <p className={styles.c_ibg1vp}>총 발송 메시지</p>
              <p className={styles.c_1wgu1eb}>{messages.length}</p>
            </div>
            <div className={styles.c_1azj537}>
              <Send className={styles.c_12qcbxf} size={24} />
            </div>
          </div>
        </div>

        <div className={styles.c_6422n}>
          <div className={styles.c_xc8ak4}>
            <div>
              <p className={styles.c_ibg1vp}>총 수신자 수</p>
              <p className={styles.c_1wgu1eb}>{totalRecipients.toLocaleString()}</p>
            </div>
            <div className={styles.c_qn9cgu}>
              <Users className={styles.c_1uwkr4c} size={24} />
            </div>
          </div>
        </div>

        <div className={styles.c_6422n}>
          <div className={styles.c_xc8ak4}>
            <div>
              <p className={styles.c_ibg1vp}>평균 오픈률</p>
              <p className={styles.c_1wgu1eb}>{averageOpenRate.toFixed(1)}%</p>
            </div>
            <div className={styles.c_1m3bfad}>
              <TrendingUp className={styles.c_53mked} size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className={styles.c_gg5z1m}>
        <div className={styles.c_1rwv5zq}>
          <button
            onClick={() => setActiveTab('send')}
            className={`${styles.tabButton} ${
              activeTab === 'send' ? styles.tabButtonActive : styles.tabButtonInactive
            }`}
          >
            <div className={styles.c_2ca09w}>
              <Send size={18} />
              메시지 발송
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${styles.tabButton} ${
              activeTab === 'history' ? styles.tabButtonActive : styles.tabButtonInactive
            }`}
          >
            <div className={styles.c_2ca09w}>
              <Bell size={18} />
              발송 내역
            </div>
          </button>
        </div>
      </div>

      {/* 메시지 발송 탭 */}
      {activeTab === 'send' && (
        <div className={styles.c_6422n}>
          <div className={styles.c_5znanu}>
            <Send className={styles.c_12qcbxf} size={24} />
            <h3 className={styles.c_y1t0l}>새 메시지 발송</h3>
          </div>

          <form onSubmit={handleSubmit} className={styles.c_1j8i8bf}>
            <div className={styles.c_45f187}>
              {/* 메시지 유형 */}
              <div>
                <label className={styles.c_a41skz}>
                  메시지 유형 <span className={styles.c_uurwux}>*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className={styles.c_mbvevs}
                >
                  <option value="안내">안내</option>
                  <option value="광고">광고</option>
                  <option value="이벤트">이벤트</option>
                  <option value="업데이트">업데이트</option>
                </select>
              </div>

              {/* 발송 대상 */}
              <div>
                <label className={styles.c_a41skz}>
                  발송 대상 <span className={styles.c_uurwux}>*</span>
                </label>
                <select
                  name="target"
                  value={formData.target}
                  onChange={handleChange}
                  required
                  className={styles.c_mbvevs}
                >
                  <option value="전체 회원">전체 회원 (1,523명)</option>
                  <option value="활성 회원">활성 회원 (982명)</option>
                  <option value="휴면 회원">휴면 회원 (435명)</option>
                  <option value="VIP 회원">VIP 회원 (106명)</option>
                </select>
              </div>
            </div>

            {/* 제목 */}
            <div>
              <label className={styles.c_a41skz}>
                제목 <span className={styles.c_uurwux}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="메시지 제목을 입력하세요"
                className={styles.c_mbvevs}
              />
            </div>

            {/* 내용 */}
            <div>
              <label className={styles.c_a41skz}>
                메시지 내용 <span className={styles.c_uurwux}>*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={6}
                placeholder="메시지 내용을 입력하세요"
                className={styles.c_1amsm21}
              />
              <p className={styles.c_d8pr7p}>최대 200자까지 입력할 수 있습니다.</p>
            </div>

            {/* 발송 시간 설정 */}
            <div className={styles.c_vhsfy5}>
              <label className={styles.c_5znans}>
                <input
                  type="radio"
                  checked={formData.sendNow}
                  onChange={() => setFormData({ ...formData, sendNow: true })}
                  className={styles.c_qc79hs}
                />
                <span className={styles.c_1my1zyy}>즉시 발송</span>
              </label>
              
              <label className={styles.c_5znans}>
                <input
                  type="radio"
                  checked={!formData.sendNow}
                  onChange={() => setFormData({ ...formData, sendNow: false })}
                  className={styles.c_qc79hs}
                />
                <span className={styles.c_1my1zyy}>예약 발송</span>
              </label>

              {!formData.sendNow && (
                <div className={styles.c_u9ymhy}>
                  <div>
                    <label className={styles.c_1w6vdon}>날짜</label>
                    <input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleChange}
                      required={!formData.sendNow}
                      min={new Date().toISOString().split('T')[0]}
                      className={styles.c_mkcud5}
                    />
                  </div>
                  <div>
                    <label className={styles.c_1w6vdon}>시간</label>
                    <input
                      type="time"
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleChange}
                      required={!formData.sendNow}
                      className={styles.c_mkcud5}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className={styles.c_sm9r4r}>
              <button
                type="button"
                onClick={() => setFormData({
                  title: '',
                  content: '',
                  type: '안내',
                  target: '전체 회원',
                  sendNow: true,
                  scheduledDate: '',
                  scheduledTime: '',
                })}
                className={styles.c_8zbzmp}
              >
                초기화
              </button>
              <button
                type="submit"
                className={styles.c_mk9nis}
              >
                <Send size={18} />
                {formData.sendNow ? '즉시 발송' : '예약하기'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 발송 내역 탭 */}
      {activeTab === 'history' && (
        <div className={styles.c_4rnbt2}>
          <div className={styles.c_65x7hk}>
            <h3 className={styles.c_1l693jk}>발송 내역</h3>
            <div className={styles.c_8s05pk}>
              <div className={styles.c_14sfe4c}>
                <Search className={styles.c_1y94mk} size={20} />
                <input
                  type="text"
                  placeholder="제목이나 내용으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.c_lwq1hq}
                />
              </div>
              <div className={styles.c_2ca09w}>
                <Filter size={16} className={styles.c_1cnlnvv} />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={styles.c_1fl6ab8}
                >
                  <option value="all">모든 유형</option>
                  <option value="광고">광고</option>
                  <option value="안내">안내</option>
                  <option value="이벤트">이벤트</option>
                  <option value="업데이트">업데이트</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.c_1bb8j67}>
            <table className={styles.c_1l2zdph}>
              <thead className={styles.c_z838al}>
                <tr>
                  <th className={styles.c_wiarv4}>메시지</th>
                  <th className={styles.c_wiarv4}>유형</th>
                  <th className={styles.c_wiarv4}>발송 대상</th>
                  <th className={styles.c_wiarv4}>수신자</th>
                  <th className={styles.c_wiarv4}>오픈률</th>
                  <th className={styles.c_wiarv4}>상태</th>
                  <th className={styles.c_wiarv4}>발송일시</th>
                </tr>
              </thead>
              <tbody className={styles.c_fyf4x}>
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((message) => (
                    <tr key={message.id} className={styles.c_x2lcqj}>
                      <td className={styles.c_g43mv3}>
                        <div>
                          <p className={styles.c_1my21gc}>{message.title}</p>
                          <p className={styles.c_3t1c8w}>{message.content}</p>
                        </div>
                      </td>
                      <td className={styles.c_g43mv3}>
                        <span className={`${styles.tagBase} ${getTypeColor(message.type)}`}>
                          {message.type}
                        </span>
                      </td>
                      <td className={styles.c_tp85ye}>{message.target}</td>
                      <td className={styles.c_tp85ye}>{message.recipients.toLocaleString()}명</td>
                      <td className={styles.c_g43mv3}>
                        {message.openRate > 0 ? (
                          <div className={styles.c_2ca09w}>
                            <div className={styles.c_1uu0h2q}>
                              <div
                                className={`${styles.c_1qdtcev} ${getRateClass(message.openRate)}`}
                              />
                            </div>
                            <span className={styles.c_ibg3d3}>{message.openRate.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className={styles.c_ibg150}>-</span>
                        )}
                      </td>
                      <td className={styles.c_g43mv3}>
                        <span className={`${styles.tagBase} ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                      </td>
                      <td className={styles.c_tp84h0}>{message.sentAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className={styles.c_13nmcpi}>
                      발송 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
