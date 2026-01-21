'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../../commons/components/dialog';
import { Badge } from '../../commons/components/badge';
import { Button } from '../../commons/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../commons/components/select';
import type { OrderDetailData, OrderStatus } from '../../commons/types/orders';
import styles from './styles.module.css';

interface OrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderDetail?: OrderDetailData;
  selectedStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  onRequestStatusChange: () => void;
  allowedStatuses: OrderStatus[];
  isLoading?: boolean;
}

const statusLabel: Record<OrderStatus, string> = {
  PENDING: '대기',
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  CANCELED: '취소',
  FAILED: '실패',
};

const paymentStatusLabel: Record<string, string> = {
  READY: '준비',
  PAID: '결제 완료',
  CANCELED: '취소',
  FAILED: '실패',
  PENDING_PAYMENT: '결제 대기',
};

export function OrderDetailModal({
  open,
  onOpenChange,
  orderDetail,
  selectedStatus,
  onStatusChange,
  onRequestStatusChange,
  allowedStatuses,
  isLoading = false,
}: OrderDetailModalProps) {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const { order, product, user, payment } = orderDetail || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.detailContent}>
        <DialogHeader>
          <DialogTitle>주문 상세</DialogTitle>
          <DialogDescription>주문/상품/결제/사용자 정보를 확인합니다.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="ml-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        ) : !orderDetail ? (
          <div className={styles.emptyContainer}>
            <p className={styles.emptyTitle}>주문 정보를 불러올 수 없습니다</p>
          </div>
        ) : (
          <>
            <div className={styles.detailSection}>
              <h4 className={styles.sectionTitle}>주문 정보</h4>
              <div className={styles.detailGrid}>
                <DetailRow label="주문 ID" value={order?.id || '-'} />
                <DetailRow
                  label="주문 상태"
                  value={
                    <Badge variant="outline">{order?.status ? (statusLabel[order.status] ?? order.status) : '-'}</Badge>
                  }
                />
                <DetailRow label="총 금액" value={order?.total_amount ? `${order.total_amount.toLocaleString()}원` : '-'} />
                <DetailRow label="주문 일시" value={formatDate(order?.created_at)} />
              </div>
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.sectionTitle}>상품 정보</h4>
              <div className={styles.detailGrid}>
                <DetailRow label="상품명" value={product?.name || '-'} />
                <DetailRow label="상품 유형" value={product?.product_type || '-'} />
              </div>
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.sectionTitle}>결제 정보</h4>
              {payment ? (
                <div className={styles.detailGrid}>
                  <DetailRow
                    label="결제 상태"
                    value={
                      <Badge variant="outline">
                        {paymentStatusLabel[payment.status] ?? payment.status}
                      </Badge>
                    }
                  />
                  <DetailRow label="결제 금액" value={`${payment.amount.toLocaleString()}원`} />
                  <DetailRow label="결제 수단" value={payment.method} />
                  <DetailRow label="승인 시각" value={formatDate(payment.approved_at)} />
                </div>
              ) : (
                <div className={styles.emptyContainer}>결제 대기 중</div>
              )}
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.sectionTitle}>사용자 정보</h4>
              <div className={styles.detailGrid}>
                <DetailRow label="닉네임" value={user?.nickname || '-'} />
                <DetailRow label="이메일" value={user?.email || '-'} />
                <DetailRow label="전화번호" value={user?.phone_number || '-'} />
              </div>
            </div>
          </>
        )}

        {!isLoading && orderDetail && (
          <DialogFooter className={styles.footer}>
            <div className={styles.statusControl}>
              <Select
                value={selectedStatus}
                onValueChange={(value) => onStatusChange(value as OrderStatus)}
              >
              <SelectTrigger className={styles.statusSelectTrigger}>
                <SelectValue placeholder={statusLabel[selectedStatus] ?? selectedStatus}>
                  {statusLabel[selectedStatus] ?? selectedStatus}
                </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* 현재 상태를 비활성 항목으로 항상 표시 */}
                  <SelectItem value={selectedStatus} disabled>
                    {statusLabel[selectedStatus] ?? selectedStatus} (현재 상태)
                  </SelectItem>
                  {/* 허용 전이만 노출 */}
                  {allowedStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabel[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="default"
                onClick={onRequestStatusChange}
                disabled={allowedStatuses.length === 0}
              >
                상태 변경
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}
