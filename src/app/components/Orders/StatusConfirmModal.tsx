'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../commons/components/alert-dialog';

interface StatusConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusLabel: string;
  onConfirm: () => void;
}

export function StatusConfirmModal({
  open,
  onOpenChange,
  statusLabel,
  onConfirm,
}: StatusConfirmModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>상태 변경 확인</AlertDialogTitle>
          <AlertDialogDescription>
            주문 상태를 <strong>{statusLabel}</strong> 상태로 변경합니다. 진행할까요?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>변경</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
