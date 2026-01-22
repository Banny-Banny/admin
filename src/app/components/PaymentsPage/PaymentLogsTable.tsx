'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../commons/components/table';
import type { PaymentLog } from '../../commons/types/payments';
import styles from './PaymentLogsTable.module.css';

interface PaymentLogsTableProps {
  logs: PaymentLog[];
  showEmptyMessage?: boolean;
  onCancelPayment?: (paymentId: string, amount: number) => void;
}

export function PaymentLogsTable({ 
  logs, 
  showEmptyMessage = false,
  onCancelPayment,
}: PaymentLogsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      READY: '준비',
      PAID: '결제 완료',
      CANCELED: '취소',
      FAILED: '실패',
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      READY: styles.statusReady,
      PAID: styles.statusPaid,
      CANCELED: styles.statusCanceled,
      FAILED: styles.statusFailed,
    };
    return classes[status] || '';
  };

  return (
    <div className={styles.tableContainer}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>결제 ID</TableHead>
            <TableHead>주문 ID</TableHead>
            <TableHead>사용자</TableHead>
            <TableHead>금액</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>결제 시간</TableHead>
            <TableHead>실패 사유</TableHead>
            {onCancelPayment && <TableHead>액션</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 || showEmptyMessage ? (
            <TableRow>
              <TableCell colSpan={onCancelPayment ? 8 : 7} className={styles.emptyCell} data-testid="empty-cell">
                {showEmptyMessage ? (
                  <>
                    <div className={styles.emptyTitle}>결제 로그가 없습니다</div>
                    <div className={styles.emptyMessage}>조건에 맞는 결제 로그를 찾을 수 없습니다</div>
                  </>
                ) : (
                  '결제 로그가 없습니다'
                )}
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log, index) => (
              <TableRow key={log.payment_id ?? `log-${index}`}>
                <TableCell className={styles.logId}>{log.payment_id}</TableCell>
                <TableCell>{log.order_id}</TableCell>
                <TableCell>
                  {log.user ? (
                    <div>
                      <div>{log.user.nickname || log.user.email}</div>
                      {log.user.nickname && (
                        <div className={styles.secondaryText}>{log.user.email}</div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className={styles.amount}>{formatAmount(log.amount)}</TableCell>
                <TableCell>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(log.status)}`}>
                    {getStatusLabel(log.status)}
                  </span>
                </TableCell>
                <TableCell>{formatDate(log.requested_at)}</TableCell>
                <TableCell className={styles.failureReason}>
                  {log.fail_message || '-'}
                </TableCell>
                {onCancelPayment && (
                  <TableCell>
                    {log.status === 'PAID' && (
                      <button
                        onClick={() => onCancelPayment(log.payment_id, log.amount)}
                        className={styles.cancelButton}
                      >
                        취소
                      </button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
