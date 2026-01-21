'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../commons/components/table';
import type { OrderItem } from '../../commons/types/orders';
import styles from './styles.module.css';

interface OrdersTableProps {
  orders: OrderItem[];
  onOrderClick?: (order: OrderItem) => void;
  showEmptyMessage?: boolean;
}

export function OrdersTable({ orders, onOrderClick, showEmptyMessage = false }: OrdersTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
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
      PENDING: '대기',
      PENDING_PAYMENT: '결제 대기',
      PAID: '결제 완료',
      CANCELED: '취소',
      FAILED: '실패',
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (payment: OrderItem['payment']) => {
    if (!payment) return '결제 대기 중';
    const labels: Record<string, string> = {
      READY: '준비',
      PAID: '결제 완료',
      CANCELED: '취소',
      FAILED: '실패',
      PENDING_PAYMENT: '결제 대기',
    };
    return labels[payment.status] || payment.status;
  };

  return (
    <div className={styles.tableContainer}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>주문 ID</TableHead>
            <TableHead>유저</TableHead>
            <TableHead>상품명</TableHead>
            <TableHead>주문 상태</TableHead>
            <TableHead>결제 상태</TableHead>
            <TableHead>금액</TableHead>
            <TableHead>결제 방법</TableHead>
            <TableHead>주문일시</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 || showEmptyMessage ? (
            <TableRow>
              <TableCell colSpan={8} className={styles.emptyCell} data-testid="empty-cell">
                {showEmptyMessage ? (
                  <>
                    <div className={styles.emptyTitle}>주문이 없습니다</div>
                    <div className={styles.emptyMessage}>조건에 맞는 주문을 찾을 수 없습니다</div>
                  </>
                ) : (
                  '주문이 없습니다'
                )}
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow
                key={order.order_id}
                className={onOrderClick ? styles.clickableRow : undefined}
                onClick={() => onOrderClick?.(order)}
              >
                <TableCell>{order.order_id}</TableCell>
                <TableCell>
                  <div>
                    <div>{order.user.nickname}</div>
                    <div className={styles.secondaryText}>{order.user.email}</div>
                  </div>
                </TableCell>
                <TableCell>{order.product.name}</TableCell>
                <TableCell>{getStatusLabel(order.order_status)}</TableCell>
                <TableCell>{getPaymentStatusLabel(order.payment)}</TableCell>
                <TableCell>{formatAmount(order.total_amount)}</TableCell>
                <TableCell>
                  {order.payment ? order.payment.method : '-'}
                </TableCell>
                <TableCell>{formatDate(order.created_at)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
