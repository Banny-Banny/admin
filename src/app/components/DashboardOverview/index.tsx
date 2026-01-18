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

export function DashboardOverview() {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  return (
    <div className={styles.c_1j8i8bf}>
      <div>
        <h2 className={styles.c_1dlkxbt}>대시보드</h2>
        <p className={styles.c_9ngaqo}>전체 통계 및 최근 활동을 확인하세요</p>
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