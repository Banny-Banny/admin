'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useOrderDetail,
  useOrders,
  useUpdateOrderStatus,
} from '../../commons/hooks/use-admin-orders';
import type { OrderFilters, OrderItem, OrderStatus } from '../../commons/types/orders';
import { Filters } from './Filters';
import { OrdersTable } from './OrdersTable';
import { Pagination } from './Pagination';
import { OrderDetailModal } from './OrderDetailModal';
import { StatusConfirmModal } from './StatusConfirmModal';
import styles from './styles.module.css';

const OrdersPage = () => {
  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['PENDING_PAYMENT', 'PAID', 'CANCELED', 'FAILED'],
    PENDING_PAYMENT: ['PAID', 'CANCELED', 'FAILED'],
    PAID: ['CANCELED', 'FAILED'],
    CANCELED: [],
    FAILED: [],
  };

  const [filters, setFilters] = useState<OrderFilters>({
    status: 'ALL',
    paymentStatus: 'ALL',
    limit: 20,
    offset: 0,
  });

  const { data, isLoading, error } = useOrders(filters);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('PENDING');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<OrderStatus[]>([]);

  const {
    data: detailData,
    isLoading: detailLoading,
    error: detailError,
  } = useOrderDetail(selectedOrderId);

  const updateStatusMutation = useUpdateOrderStatus(selectedOrderId || '');

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters({ ...newFilters, offset: 0 }); // 필터 변경 시 첫 페이지로
  };

  const handlePageChange = (newOffset: number) => {
    setFilters({ ...filters, offset: newOffset });
  };

  const handleSelectOrder = (order: OrderItem) => {
    setSelectedOrderId(order.order_id);
    setSelectedStatus(order.order_status);
    setAvailableStatuses(allowedTransitions[order.order_status] ?? []);
  };

  const handleStatusChangeRequest = () => {
    // 현재 상태와 동일하면 변경 요청 차단
    if (detailData?.order && detailData.order.status === selectedStatus) {
      toast.error('이미 선택한 상태입니다');
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedOrderId || !detailData?.order) return;

    // 현재 상태와 동일하면 변경 요청 차단
    if (detailData.order.status === selectedStatus) {
      toast.error('이미 선택한 상태입니다');
      setIsConfirmOpen(false);
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({ status: selectedStatus });
      toast.success('주문 상태가 변경되었습니다');
      setIsConfirmOpen(false);
    } catch (error: any) {
      // 에러 메시지 추출 및 표시
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        '상태 변경에 실패했습니다';
      toast.error(errorMessage);
      setIsConfirmOpen(false);
    }
  };

  const statusLabel = useMemo(() => {
    const labels: Record<OrderStatus, string> = {
      PENDING: '대기',
      PENDING_PAYMENT: '결제 대기',
      PAID: '결제 완료',
      CANCELED: '취소',
      FAILED: '실패',
    };
    return labels[selectedStatus] ?? selectedStatus;
  }, [selectedStatus]);

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">주문 관리</h1>
        <p className="text-gray-600">주문 목록을 조회하고 관리할 수 있습니다</p>
      </div>

      <Filters filters={filters} onFiltersChange={handleFiltersChange} />

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="ml-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      ) : error ? (
        <>
          <OrdersTable orders={[]} onOrderClick={handleSelectOrder} />
          <div className={styles.errorContainer} data-testid="error-container">
            <p className={styles.errorTitle}>데이터를 불러오는 중 오류가 발생했습니다</p>
            <p className={styles.errorMessage}>
              {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
            </p>
          </div>
        </>
      ) : (
        <>
          <OrdersTable 
            orders={data?.items || []} 
            onOrderClick={handleSelectOrder}
            showEmptyMessage={!data || data.items.length === 0}
          />
          {data && data.items.length > 0 && (
            <Pagination
              meta={{
                total: data.total,
                limit: data.limit,
                offset: data.offset,
              }}
              onPageChange={handlePageChange}
            />
          )}

          <OrderDetailModal
            open={Boolean(selectedOrderId)}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedOrderId(undefined);
                setAvailableStatuses([]);
              }
            }}
            orderDetail={detailData}
            selectedStatus={selectedStatus}
            onStatusChange={(status) => setSelectedStatus(status)}
            onRequestStatusChange={handleStatusChangeRequest}
            allowedStatuses={availableStatuses}
            isLoading={detailLoading}
          />

          <StatusConfirmModal
            open={isConfirmOpen}
            onOpenChange={setIsConfirmOpen}
            statusLabel={statusLabel}
            onConfirm={handleConfirmStatusChange}
          />
        </>
      )}
    </div>
  );
};

export default OrdersPage;
