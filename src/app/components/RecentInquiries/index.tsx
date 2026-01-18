import { MessageSquare, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import styles from "./styles.module.css";

interface Inquiry {
  id: number;
  customer: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  time: string;
  date: string;
}

interface RecentInquiriesProps {
  onSelectInquiry: (inquiry: Inquiry) => void;
}

export function RecentInquiries({ onSelectInquiry }: RecentInquiriesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 5;

  const inquiries = [
    {
      id: 1,
      customer: '김철수',
      email: 'kim@example.com',
      subject: '배송 지연 문의',
      message: '주문한 상품이 예정일보다 늦어지고 있습니다. 확인 부탁드립니다.',
      status: '대기중',
      priority: 'high',
      time: '5분 전',
      date: '2026-01-17 14:23',
    },
    {
      id: 2,
      customer: '이영희',
      email: 'lee@example.com',
      subject: '환불 요청',
      message: '상품이 설명과 다릅니다. 환불 처리 부탁드립니다.',
      status: '처리중',
      priority: 'high',
      time: '32분 전',
      date: '2026-01-17 13:55',
    },
    {
      id: 3,
      customer: '박민수',
      email: 'park@example.com',
      subject: '상품 재고 문의',
      message: '품절된 상품의 재입고 예정일을 알고 싶습니다.',
      status: '완료',
      priority: 'medium',
      time: '1시간 전',
      date: '2026-01-17 13:15',
    },
    {
      id: 4,
      customer: '정수진',
      email: 'jung@example.com',
      subject: '회원가입 오류',
      message: '회원가입 시 인증 메일이 오지 않습니다.',
      status: '대기중',
      priority: 'medium',
      time: '2시간 전',
      date: '2026-01-17 12:30',
    },
    {
      id: 5,
      customer: '최동욱',
      email: 'choi@example.com',
      subject: '할인 쿠폰 문의',
      message: '이벤트 쿠폰이 적용되지 않습니다.',
      status: '완료',
      priority: 'low',
      time: '3시간 전',
      date: '2026-01-17 11:45',
    },
    {
      id: 6,
      customer: '강지혜',
      email: 'kang@example.com',
      subject: '결제 오류',
      message: '결제 진행 중 오류가 발생했습니다.',
      status: '처리중',
      priority: 'high',
      time: '4시간 전',
      date: '2026-01-17 10:30',
    },
    {
      id: 7,
      customer: '윤서준',
      email: 'yoon@example.com',
      subject: '교환 문의',
      message: '사이즈가 맞지 않아 교환하고 싶습니다.',
      status: '대기중',
      priority: 'medium',
      time: '5시간 전',
      date: '2026-01-17 09:15',
    },
    {
      id: 8,
      customer: '임하은',
      email: 'lim@example.com',
      subject: '포인트 사용 문의',
      message: '적립된 포인트 사용 방법을 알려주세요.',
      status: '완료',
      priority: 'low',
      time: '6시간 전',
      date: '2026-01-17 08:45',
    },
  ];

  // 필터링
  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || inquiry.priority === priorityFilter;
    const matchesSearch = 
      inquiry.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInquiries = filteredInquiries.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '완료':
        return <CheckCircle className={styles.c_1uwkqdn} size={16} />;
      case '처리중':
        return <Clock className={styles.c_12qcb6q} size={16} />;
      case '대기중':
        return <AlertCircle className={styles.c_2i067q} size={16} />;
      default:
        return <MessageSquare className={styles.c_1cnlnvv} size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료':
        return styles.statusDone;
      case '처리중':
        return styles.statusProcessing;
      case '대기중':
        return styles.statusWaiting;
      default:
        return styles.statusDefault;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return styles.priorityHigh;
      case 'medium':
        return styles.priorityMedium;
      case 'low':
        return styles.priorityLow;
      default:
        return styles.priorityDefault;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '긴급';
      case 'medium':
        return '보통';
      case 'low':
        return '낮음';
      default:
        return '보통';
    }
  };

  return (
    <div className={styles.c_4rnbt2}>
      <div className={styles.c_65x7hk}>
        <div className={styles.c_1mytzjc}>
          <div>
            <h3 className={styles.c_1cmvr70}>최근 문의 사항</h3>
            <p className={styles.c_10byyx2}>고객 문의 및 요청사항을 확인하세요</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={styles.c_8s05pk}>
          <div className={styles.c_14sfe4c}>
            <Search className={styles.c_1y94mk} size={20} />
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.c_lwq1hq}
            />
          </div>

          <div className={styles.c_2ca09w}>
            <Filter size={16} className={styles.c_1cnlnvv} />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.c_1fl6ab8}
            >
              <option value="all">모든 상태</option>
              <option value="대기중">대기중</option>
              <option value="처리중">처리중</option>
              <option value="완료">완료</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.c_1fl6ab8}
            >
              <option value="all">모든 우선순위</option>
              <option value="high">긴급</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.c_fyf4x}>
        {currentInquiries.length > 0 ? (
          currentInquiries.map((inquiry) => (
            <div 
              key={inquiry.id} 
              className={styles.c_1h3v33w}
              onClick={() => onSelectInquiry(inquiry)}
            >
              <div className={styles.c_oi2yba}>
                <div className={styles.c_1dzu82l}>
                  <div className={styles.c_6gox1x}>
                    <h4 className={styles.c_we5pmo}>{inquiry.subject}</h4>
                    <span className={`${styles.tagBase} ${getStatusColor(inquiry.status)}`}>
                      {inquiry.status}
                    </span>
                    <span className={`${styles.tagBase} ${getPriorityColor(inquiry.priority)}`}>
                      {getPriorityLabel(inquiry.priority)}
                    </span>
                  </div>
                  <p className={styles.c_z9fcgj}>{inquiry.message}</p>
                  <div className={styles.c_1l53ve4}>
                    <div className={styles.c_2ca09v}>
                      <MessageSquare size={14} />
                      <span>{inquiry.customer}</span>
                    </div>
                    <span>•</span>
                    <span>{inquiry.email}</span>
                    <span>•</span>
                    <span>{inquiry.time}</span>
                  </div>
                </div>
                <div className={styles.c_2ca09w}>
                  {getStatusIcon(inquiry.status)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.c_g9tmm}>
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.c_cnx530}>
          <div className={styles.c_xc8ak4}>
            <p className={styles.c_ibg2me}>
              전체 {filteredInquiries.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredInquiries.length)}개 표시
            </p>
            <div className={styles.c_2ca09w}>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.c_12e7rfd}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className={styles.c_2ca09v}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`${styles.pageButton} ${
                      currentPage === page
                        ? styles.pageButtonActive
                        : styles.pageButtonInactive
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.c_12e7rfd}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}