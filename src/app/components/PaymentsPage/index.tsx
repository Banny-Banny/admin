'use client';

import { useState, useMemo } from 'react';
import { usePaymentLogs } from '../../commons/hooks/use-payments';
import type { PaymentLogsFilters } from '../../commons/types/payments';
import { PaymentLogsFilters as PaymentLogsFiltersComponent } from './PaymentLogsFilters';
import { PaymentLogsTable } from './PaymentLogsTable';
import { CancelPaymentModal } from './CancelPaymentModal';
import { ReceiptReissueModal } from './ReceiptReissueModal';
import { Pagination } from '../Orders/Pagination';
import styles from './styles.module.css';

export function PaymentsPage() {
  const [filters, setFilters] = useState<PaymentLogsFilters>({
    status: 'ALL',
    limit: 20,
    offset: 0,
  });

  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPaymentAmount, setSelectedPaymentAmount] = useState<number>(0);

  const { data, isLoading, error } = usePaymentLogs(filters);

  const handleFiltersChange = (newFilters: PaymentLogsFilters) => {
    setFilters({ ...newFilters, offset: 0 }); // 필터 변경 시 첫 페이지로
  };

  const handlePageChange = (newOffset: number) => {
    setFilters({ ...filters, offset: newOffset });
  };

  const handleCancelPayment = (paymentId: string, amount: number) => {
    setSelectedPaymentId(paymentId);
    setSelectedPaymentAmount(amount);
    setIsCancelModalOpen(true);
  };

  const handleReissueReceipt = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsReceiptModalOpen(true);
  };

  const paginationMeta = useMemo(() => {
    if (!data) {
      return {
        total: 0,
        limit: 20,
        offset: 0,
      };
    }
    return {
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    };
  }, [data]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>결제 관리</h1>
        <p className={styles.description}>
          결제 로그를 조회하고, 결제를 취소하며, 영수증을 재발급할 수 있습니다
        </p>
      </div>

      <PaymentLogsFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} />

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>데이터를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer} data-testid="error-container">
          <p className={styles.errorTitle}>데이터를 불러오는 중 오류가 발생했습니다</p>
          <p className={styles.errorMessage}>
            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
          </p>
          {error instanceof Error && error.message && (
            <details className={styles.errorDetails}>
              <summary>에러 상세 정보</summary>
              <pre>{JSON.stringify(error, null, 2)}</pre>
            </details>
          )}
        </div>
      ) : (
        <>
          {data && (
            <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px' }}>
              <small>
                총 {data.total}개 중 {data.items.length}개 표시 (limit: {data.limit}, offset: {data.offset})
              </small>
            </div>
          )}
          <PaymentLogsTable
            logs={data?.items || []}
            showEmptyMessage={!data || !data.items || data.items.length === 0}
            onCancelPayment={handleCancelPayment}
            onReissueReceipt={handleReissueReceipt}
          />
          {data && data.items.length > 0 && (
            <Pagination meta={paginationMeta} onPageChange={handlePageChange} />
          )}
        </>
      )}

      {selectedPaymentId && (
        <CancelPaymentModal
          open={isCancelModalOpen}
          onOpenChange={(open) => {
            setIsCancelModalOpen(open);
            if (!open) {
              setSelectedPaymentId(null);
              setSelectedPaymentAmount(0);
            }
          }}
          paymentId={selectedPaymentId}
          paymentAmount={selectedPaymentAmount}
        />
      )}

      {selectedOrderId && (
        <ReceiptReissueModal
          open={isReceiptModalOpen}
          onOpenChange={(open) => {
            setIsReceiptModalOpen(open);
            if (!open) {
              setSelectedOrderId(null);
            }
          }}
          orderId={selectedOrderId}
        />
      )}
    </div>
  );
}
