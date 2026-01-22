'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/commons/components/dialog';
import { Button } from '@/app/commons/components/button';
import { Input } from '@/app/commons/components/input';
import { Textarea } from '@/app/commons/components/textarea';
import { useCancelPayment } from '@/app/commons/hooks/use-payments';
import type { CancelPaymentRequest, RefundReceiveAccount } from '@/app/commons/types/payments';
import styles from './CancelPaymentModal.module.css';

interface CancelPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  paymentAmount?: number;
}

interface CancelPaymentFormData {
  cancelReason: string;
  cancelAmount: number;
  refundReceiveAccount?: RefundReceiveAccount;
}

export function CancelPaymentModal({
  open,
  onOpenChange,
  paymentId,
  paymentAmount = 0,
}: CancelPaymentModalProps) {
  const [showRefundAccount, setShowRefundAccount] = useState(false);
  const cancelPayment = useCancelPayment();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CancelPaymentFormData>({
    defaultValues: {
      cancelReason: '',
      cancelAmount: paymentAmount,
      refundReceiveAccount: {
        bankName: '',
        accountNumber: '',
        accountHolder: '',
      },
    },
  });

  const watchedCancelAmount = watch('cancelAmount');

  const onSubmit = async (data: CancelPaymentFormData) => {
    if (cancelPayment.isPending) return;

    try {
      const requestData: CancelPaymentRequest = {
        cancelReason: data.cancelReason,
        cancelAmount: data.cancelAmount,
        refundReceiveAccount: showRefundAccount
          ? {
              bankName: data.refundReceiveAccount?.bankName || undefined,
              accountNumber: data.refundReceiveAccount?.accountNumber || undefined,
              accountHolder: data.refundReceiveAccount?.accountHolder || undefined,
            }
          : undefined,
      };

      await cancelPayment.mutateAsync({
        id: paymentId,
        data: requestData,
      });

      toast.success('결제가 성공적으로 취소되었습니다');
      reset();
      setShowRefundAccount(false);
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '결제 취소에 실패했습니다. 다시 시도해주세요.';
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!cancelPayment.isPending) {
      reset();
      setShowRefundAccount(false);
      onOpenChange(false);
    }
  };

  const isFullRefund = watchedCancelAmount === paymentAmount;
  const isPartialRefund = watchedCancelAmount > 0 && watchedCancelAmount < paymentAmount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={styles.modalContent}>
        <DialogHeader>
          <DialogTitle>결제 취소</DialogTitle>
          <DialogDescription>
            결제를 취소하고 환불을 진행합니다. 취소 사유와 환불 금액을 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="cancelReason" className={styles.label}>
              취소 사유 <span className={styles.required}>*</span>
            </label>
            <Textarea
              id="cancelReason"
              {...register('cancelReason', {
                required: '취소 사유를 입력해주세요',
                minLength: {
                  value: 1,
                  message: '취소 사유를 입력해주세요',
                },
              })}
              placeholder="취소 사유를 입력해주세요"
              rows={4}
              className={errors.cancelReason ? styles.inputError : ''}
            />
            {errors.cancelReason && (
              <span className={styles.errorMessage}>{errors.cancelReason.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cancelAmount" className={styles.label}>
              취소 금액 <span className={styles.required}>*</span>
            </label>
            <Input
              id="cancelAmount"
              type="number"
              {...register('cancelAmount', {
                required: '취소 금액을 입력해주세요',
                min: {
                  value: 1,
                  message: '취소 금액은 1원 이상이어야 합니다',
                },
                max: {
                  value: paymentAmount,
                  message: `취소 금액은 결제 금액(${paymentAmount.toLocaleString()}원)을 초과할 수 없습니다`,
                },
                valueAsNumber: true,
              })}
              placeholder="취소 금액을 입력해주세요"
              className={errors.cancelAmount ? styles.inputError : ''}
            />
            {errors.cancelAmount && (
              <span className={styles.errorMessage}>{errors.cancelAmount.message}</span>
            )}
            <div className={styles.amountInfo}>
              <span>결제 금액: {paymentAmount.toLocaleString()}원</span>
              {isFullRefund && <span className={styles.fullRefund}>전체 환불</span>}
              {isPartialRefund && (
                <span className={styles.partialRefund}>
                  부분 환불 ({paymentAmount - watchedCancelAmount}원 남음)
                </span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showRefundAccount}
                onChange={(e) => setShowRefundAccount(e.target.checked)}
                className={styles.checkbox}
              />
              <span>환불 계좌 정보 입력 (선택사항)</span>
            </label>
          </div>

          {showRefundAccount && (
            <div className={styles.refundAccountSection}>
              <div className={styles.formGroup}>
                <label htmlFor="bankName" className={styles.label}>
                  은행명
                </label>
                <Input
                  id="bankName"
                  {...register('refundReceiveAccount.bankName')}
                  placeholder="은행명을 입력해주세요"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="accountNumber" className={styles.label}>
                  계좌번호
                </label>
                <Input
                  id="accountNumber"
                  {...register('refundReceiveAccount.accountNumber')}
                  placeholder="계좌번호를 입력해주세요"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="accountHolder" className={styles.label}>
                  예금주명
                </label>
                <Input
                  id="accountHolder"
                  {...register('refundReceiveAccount.accountHolder')}
                  placeholder="예금주명을 입력해주세요"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={cancelPayment.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={cancelPayment.isPending}>
              {cancelPayment.isPending ? '처리 중...' : '결제 취소'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
