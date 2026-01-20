'use client';

import { useState, useEffect } from 'react';
import { RecentInquiries } from '../RecentInquiries';
import { ChatInterface } from '../ChatInterface';
import { getInquiries, type Inquiry as ApiInquiry } from '../../commons/apis/inquiry';
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
        />
      ) : (
        <RecentInquiries 
          onSelectInquiry={setSelectedInquiry}
        />
      )}
    </div>
  );
}
