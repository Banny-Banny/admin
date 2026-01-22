import { apiClient } from '../../provider/api-provider/api-client';

// ============================================================================
// 타입 정의
// ============================================================================

// 알림 메시지 유형
export type NotificationType = '광고' | '안내' | '이벤트' | '업데이트';

// 발송 대상
export type NotificationTarget = '전체 회원' | '활성 회원' | '휴면 회원' | 'VIP 회원';

// 알림 전송 요청
export interface SendNotificationRequest {
  title: string;
  content: string;
  type: NotificationType;
  target: NotificationTarget;
  sendNow: boolean;
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
}

// 알림 전송 응답
export interface SendNotificationResponse {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  target: NotificationTarget;
  status: '발송완료' | '발송대기' | '예약';
  sentAt: string;
  recipients: number;
  message?: string;
}

// 알림 목록 조회 응답
export interface GetNotificationsResponse {
  notifications: NotificationMessage[];
  total: number;
}

// 알림 메시지
export interface NotificationMessage {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  target: NotificationTarget;
  status: '발송완료' | '발송대기' | '예약';
  sentAt: string;
  recipients: number;
  openRate: number;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// 백엔드 API 형식
// ============================================================================

// 백엔드가 기대하는 targetType
export type BackendTargetType = 'USER' | 'ALL';

// 백엔드가 기대하는 notification type
export type BackendNotificationType = 
  | 'CAPSULE_OPEN'
  | 'FRIEND_ADD'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'EGG_DISCOVERED'
  | 'EASTER_EGG_VIEWED'
  | 'EGG_DELETED'
  | 'SYSTEM'
  | 'MARKETING';

// 프론트엔드 타입을 백엔드 타입으로 변환
function convertTargetToBackend(target: NotificationTarget): BackendTargetType {
  switch (target) {
    case '전체 회원':
      return 'ALL';
    case '활성 회원':
    case '휴면 회원':
    case 'VIP 회원':
    default:
      return 'USER';
  }
}

// 프론트엔드 타입을 백엔드 타입으로 변환
function convertTypeToBackend(type: NotificationType): BackendNotificationType {
  switch (type) {
    case '광고':
    case '이벤트':
      return 'MARKETING';
    case '안내':
    case '업데이트':
    default:
      return 'SYSTEM';
  }
}

// ============================================================================
// API 함수
// ============================================================================

/**
 * 알림 전송
 * @param data 알림 전송 요청 데이터
 * @returns 알림 전송 응답
 */
export async function sendNotification(
  data: SendNotificationRequest
): Promise<SendNotificationResponse> {
  // 백엔드가 기대하는 형식으로 변환
  const requestBody: {
    title: string;
    content: string;
    type: BackendNotificationType;
    targetType: BackendTargetType;
    sendNow: boolean;
    scheduledDate?: string;
    scheduledTime?: string;
  } = {
    title: data.title,
    content: data.content,
    type: convertTypeToBackend(data.type),
    targetType: convertTargetToBackend(data.target),
    sendNow: data.sendNow,
  };

  // 예약 발송인 경우에만 날짜/시간 추가
  if (!data.sendNow) {
    if (data.scheduledDate) {
      requestBody.scheduledDate = data.scheduledDate;
    }
    if (data.scheduledTime) {
      requestBody.scheduledTime = data.scheduledTime;
    }
  }

  console.log('📤 알림 전송 요청 (백엔드 형식):', requestBody);
  console.log('📤 원본 데이터:', data);

  try {
    const response = await apiClient.post<{ success?: boolean; data?: SendNotificationResponse } | SendNotificationResponse>(
      '/api/admin/notifications',
      requestBody
    );

    // 백엔드 응답 형식에 따라 처리
    if ('success' in response && response.success && response.data) {
      return response.data;
    }

    return response as SendNotificationResponse;
  } catch (error) {
    console.error('❌ 알림 전송 실패:', error);
    throw error;
  }
}

/**
 * 알림 목록 조회
 * @returns 알림 목록
 */
export async function getNotifications(): Promise<GetNotificationsResponse> {
  try {
    const response = await apiClient.get<{ success?: boolean; data?: { items?: NotificationMessage[]; total?: number } } | GetNotificationsResponse>(
      '/api/admin/notifications'
    );

    // 백엔드 응답 형식에 따라 처리
    if ('success' in response && response.success && response.data) {
      return {
        notifications: response.data.items || [],
        total: response.data.total || 0,
      };
    }

    return response as GetNotificationsResponse;
  } catch (error) {
    console.error('❌ 알림 목록 조회 실패:', error);
    throw error;
  }
}
