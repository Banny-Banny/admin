'use client';

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
import { useReissueReceipt } from '@/app/commons/hooks/use-payments';
import type { ReissueReceiptRequest } from '@/app/commons/types/payments';
import styles from './ReceiptReissueModal.module.css';

interface ReceiptReissueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

interface ReceiptReissueFormData {
  email: string;
}

export function ReceiptReissueModal({
  open,
  onOpenChange,
  orderId,
}: ReceiptReissueModalProps) {
  const reissueReceipt = useReissueReceipt();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReceiptReissueFormData>({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ReceiptReissueFormData) => {
    if (reissueReceipt.isPending) return;

    try {
      const requestData: ReissueReceiptRequest = {
        email: data.email,
      };

      await reissueReceipt.mutateAsync({
        orderId,
        data: requestData,
      });

      toast.success('영수증 재발급이 요청되었습니다');
      reset();
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '영수증 재발급에 실패했습니다. 다시 시도해주세요.';
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!reissueReceipt.isPending) {
      reset();
      onOpenChange(false);
    }
  };

  // 이메일 형식 검증 함수
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      return '이메일 주소를 입력해주세요';
    }
    if (!emailRegex.test(value)) {
      return '유효한 이메일 형식을 입력해주세요';
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={styles.modalContent}>
        <DialogHeader>
          <DialogTitle>영수증 재발급</DialogTitle>
          <DialogDescription>
            주문에 대한 영수증을 재발급합니다. 발송할 이메일 주소를 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              이메일 주소 <span className={styles.required}>*</span>
            </label>
            <Input
              id="email"
              type="email"
              {...register('email', {
                required: '이메일 주소를 입력해주세요',
                validate: validateEmail,
              })}
              placeholder="customer@example.com"
              className={errors.email ? styles.inputError : ''}
            />
            {errors.email && (
              <span className={styles.errorMessage}>{errors.email.message}</span>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={reissueReceipt.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={reissueReceipt.isPending}>
              {reissueReceipt.isPending ? '처리 중...' : '재발급'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
