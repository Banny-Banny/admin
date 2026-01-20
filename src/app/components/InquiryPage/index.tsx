'use client';

import { useState, useEffect } from 'react';
import { RecentInquiries } from '../RecentInquiries';
import { ChatInterface } from '../ChatInterface';
import { getInquiries, type Inquiry as ApiInquiry, type InquiryStatus } from '../../commons/apis/inquiry';
import styles from "./styles.module.css";

// API 응답 구조에 맞는 타입
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
  );
}
