'use client';

import { useState } from 'react';
import { RecentInquiries } from '../RecentInquiries';
import { ChatInterface } from '../ChatInterface';
import { ErrorBoundary } from '../error-boundary';
import { type Inquiry, type InquiryStatus } from '../../commons/types/inquiry';
import styles from "./styles.module.css";

export function InquiryPage() {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  // 상태 변경 핸들러
  const handleStatusChange = (inquiryId: string, newStatus: InquiryStatus) => {
    // 선택된 문의의 상태 업데이트
    if (selectedInquiry && selectedInquiry.id === inquiryId) {
      setSelectedInquiry({ ...selectedInquiry, status: newStatus });
    }
    
    // 목록의 문의 상태도 업데이트
    setInquiries(prev =>
      prev.map(inq =>
        inq.id === inquiryId ? { ...inq, status: newStatus } : inq
      )
    );
  };

  return (
    <ErrorBoundary>
      <div className={styles.c_1j8i8bf}>
        <div>
          <h2 className={styles.c_1dlkxbt}>문의하기</h2>
          <p className={styles.c_9ngaqo}>고객 문의 및 요청사항을 확인하고 관리하세요</p>
        </div>

        {selectedInquiry ? (
          <ChatInterface 
            inquiry={selectedInquiry} 
            onClose={() => setSelectedInquiry(null)}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <RecentInquiries 
            onSelectInquiry={setSelectedInquiry}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
