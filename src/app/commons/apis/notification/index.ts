import { apiClient } from '../../provider/api-provider/api-client';
import {
  SendNotificationRequest,
  SendNotificationResponse,
} from './types';

/**
 * 알림 메시지를 발송(또는 예약)합니다.
 */
export async function sendNotification(
  payload: SendNotificationRequest
): Promise<SendNotificationResponse> {
  return apiClient.post<SendNotificationResponse>(
    '/api/admin/notifications',
    payload
  );
}
