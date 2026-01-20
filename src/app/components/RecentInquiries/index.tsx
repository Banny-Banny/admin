'use client';

import { MessageSquare, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Search, Filter, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { getInquiries, deleteInquiry, type InquiryStatus } from '../../commons/apis/inquiry';
import { toast } from 'sonner';
import styles from "./styles.module.css";

interface Inquiry {
  id: string;
  roomId: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

interface RecentInquiriesProps {
  onSelectInquiry: (inquiry: Inquiry) => void;
}

export function RecentInquiries({ 
  onSelectInquiry
}: RecentInquiriesProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  // API를 통한 문의 목록 조회 (필터 및 페이지네이션)
  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const params: {
          status?: InquiryStatus;
          limit: number;
          offset: number;
        } = {
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
        };

        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }

        const response = await getInquiries(params);
        setInquiries(response.inquiries);
        setTotal(response.total);
      } catch (err) {
        console.error('문의 목록 조회 실패:', err);
        setError('문의 목록을 불러오는데 실패했습니다.');
        toast.error('문의 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInquiries();
  }, [currentPage, statusFilter]);

  // 클라이언트 사이드 검색 필터링
  const filteredInquiries = useMemo(() => {
    if (!searchTerm.trim()) {
      return inquiries;
    }

    const searchLower = searchTerm.toLowerCase();
    return inquiries.filter((inquiry) => {
      const matchesCustomer = inquiry.customer.name.toLowerCase().includes(searchLower) ||
                            inquiry.customer.email.toLowerCase().includes(searchLower);
      const matchesSubject = inquiry.subject.toLowerCase().includes(searchLower);
      const matchesContent = inquiry.message.toLowerCase().includes(searchLower);
      
      return matchesCustomer || matchesSubject || matchesContent;
    });
  }, [inquiries, searchTerm]);

  // 페이지네이션 (서버 사이드 페이지네이션 사용)
  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + inquiries.length;

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // 문의 삭제
  const handleDelete = async (inquiryId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 클릭 이벤트 전파 방지
    
    if (!confirm('정말 이 문의를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingId(inquiryId);
      await deleteInquiry(inquiryId);
      toast.success('문의가 삭제되었습니다.');
      
      // 목록에서 제거
      setInquiries(prev => prev.filter(inq => inq.id !== inquiryId));
      
      // 페이지 조정 (현재 페이지에 항목이 없으면 이전 페이지로)
      if (filteredInquiries.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      console.error('문의 삭제 실패:', err);
      toast.error('문의 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  // 상태 표시 함수들
  const getStatusIcon = (status: InquiryStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className={styles.c_1uwkqdn} size={16} />;
      case 'IN_PROGRESS':
        return <Clock className={styles.c_12qcb6q} size={16} />;
      case 'ON_HOLD':
        return <AlertCircle className={styles.c_2i067q} size={16} />;
      case 'PENDING':
        return <AlertCircle className={styles.c_2i067q} size={16} />;
      default:
        return <MessageSquare className={styles.c_1cnlnvv} size={16} />;
    }
  };

  const getStatusColor = (status: InquiryStatus) => {
    switch (status) {
      case 'COMPLETED':
        return styles.statusDone;
      case 'IN_PROGRESS':
        return styles.statusProcessing;
      case 'ON_HOLD':
        return styles.statusWaiting;
      case 'PENDING':
        return styles.statusWaiting;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusLabel = (status: InquiryStatus) => {
    switch (status) {
      case 'COMPLETED':
        return '완료';
      case 'IN_PROGRESS':
        return '처리중';
      case 'ON_HOLD':
        return '보류';
      case 'PENDING':
        return '대기중';
      default:
        return status;
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
                setStatusFilter(e.target.value as InquiryStatus | 'all');
                setCurrentPage(1);
              }}
              className={styles.c_1fl6ab8}
            >
              <option value="all">모든 상태</option>
              <option value="PENDING">대기중</option>
              <option value="IN_PROGRESS">처리중</option>
              <option value="ON_HOLD">보류</option>
              <option value="COMPLETED">완료</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={styles.c_g9tmm}>
          문의 목록을 불러오는 중...
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className={styles.c_g9tmm}>
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && inquiries.length === 0 && (
        <div className={styles.c_g9tmm}>
          문의가 없습니다.
        </div>
      )}

      {/* Search No Results */}
      {!isLoading && !error && inquiries.length > 0 && filteredInquiries.length === 0 && (
        <div className={styles.c_g9tmm}>
          검색 결과가 없습니다.
        </div>
      )}

      {/* Inquiry List */}
      {!isLoading && !error && filteredInquiries.length > 0 && (
        <>
          <div className={styles.c_fyf4x}>
            {filteredInquiries.map((inquiry) => (
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
                        {getStatusLabel(inquiry.status)}
                      </span>
                    </div>
                    <p className={styles.c_z9fcgj}>{inquiry.message}</p>
                    <div className={styles.c_1l53ve4}>
                      <div className={styles.c_2ca09v}>
                        <MessageSquare size={14} />
                        <span>{inquiry.customer.name}</span>
                      </div>
                      <span>•</span>
                      <span>{inquiry.customer.email}</span>
                      <span>•</span>
                      <span>{formatDate(inquiry.createdAt)}</span>
                    </div>
                  </div>
                  <div className={styles.c_2ca09w}>
                    {getStatusIcon(inquiry.status)}
                    <button
                      onClick={(e) => handleDelete(inquiry.id, e)}
                      disabled={deletingId === inquiry.id}
                      className={styles.c_1us4dfh}
                      title="문의 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.c_cnx530}>
              <div className={styles.c_xc8ak4}>
                <p className={styles.c_ibg2me}>
                  전체 {total}개 중 {startIndex + 1}-{Math.min(endIndex, total)}개 표시
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
        </>
      )}
    </div>
  );
}
