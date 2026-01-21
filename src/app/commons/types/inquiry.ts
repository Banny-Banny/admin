/**
 * 문의하기 기능 관련 공통 타입 정의
 */

export type InquiryStatus = 'PENDING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';

export interface User {
  id: string;
  nickname: string;
  email: string | null;
}

export interface Inquiry {
  id: string;
  user: User;
  status: InquiryStatus;
  isResolved: boolean;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderType: 'USER' | 'ADMIN';
  senderUserId?: string | null;
  senderAdminId?: string | null;
  content: string;
  createdAt: string;
}

export interface GetInquiriesParams {
  status?: InquiryStatus;
  limit?: number;
  offset?: number;
}

export interface GetInquiriesResponse {
  inquiries: Inquiry[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetInquiryDetailParams {
  limit?: number;
  offset?: number;
}

export interface GetInquiryDetailResponse {
  inquiry: Inquiry;
  messages: Message[];
  total: number;
  limit: number;
  offset: number;
}

export interface UpdateInquiryStatusRequest {
  status: InquiryStatus;
}

export interface UpdateInquiryStatusResponse {
  id: string;
  status: InquiryStatus;
  message?: string;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface UpdateMessageResponse {
  id: string;
  content: string;
  message?: string;
}

export interface DeleteResponse {
  message?: string;
}