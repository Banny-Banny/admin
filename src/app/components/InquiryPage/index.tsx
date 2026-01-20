import { useState } from 'react';
import { RecentInquiries } from '../RecentInquiries';
import { ChatInterface } from '../ChatInterface';
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
        <RecentInquiries onSelectInquiry={setSelectedInquiry} />
      )}
    </div>
  );
}
