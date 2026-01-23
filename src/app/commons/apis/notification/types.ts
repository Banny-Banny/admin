// 서버에서 허용하는 알림 유형 코드
export type NotificationType =
  | 'CAPSULE_OPEN'
  | 'FRIEND_ADD'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'EGG_DISCOVERED'
  | 'EASTER_EGG_VIEWED'
  | 'EGG_DELETED'
  | 'SYSTEM'
  | 'MARKETING';

// 서버에서 허용하는 발송 대상 코드
export type TargetType = 'USER' | 'ALL';

export interface SendNotificationRequest {
  title: string;
  content: string;
  type: NotificationType;
  targetType: TargetType;
  sendNow: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface SendNotificationResponse {
  id: string;
  status: '발송완료' | '발송대기' | '예약';
  sentAt: string;
  recipients?: number;
  message?: string;
}
