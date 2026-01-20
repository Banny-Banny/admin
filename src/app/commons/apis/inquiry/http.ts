import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AuthSession } from '../../types/auth';

// ============================================================================
// Token Storage
// ============================================================================

const STORAGE_KEY = 'admin_auth_session';

const tokenStorage = {
  get: (): AuthSession | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to parse stored session:', error);
      return null;
    }
  },
  set: (session: AuthSession): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  },
  remove: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove session:', error);
    }
  },
};

// ============================================================================
// API Client
// ============================================================================

const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.API_BASE_URL || 
  'https://be-production-8aa2.up.railway.app';

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
          const session = tokenStorage.get();
          if (session?.accessToken) {
            config.headers.Authorization = `Bearer ${session.accessToken}`;
          }
        }
        return config;
      },
      (error: unknown) => {
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                const session = tokenStorage.get();
                if (session?.accessToken) {
                  originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
                }
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const session = tokenStorage.get();
            if (session?.refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/api/admin/auth/refresh`, {
                refreshToken: session.refreshToken,
              });

              const newSession = {
                ...session,
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken || session.refreshToken,
              };
              tokenStorage.set(newSession);

              this.processQueue(null);

              originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            this.processQueue(refreshError);
            tokenStorage.remove();
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        console.error('API request failed:', error);
        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: unknown): void {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });
    this.failedQueue = [];
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(endpoint, config);
    return response.data;
  }

  async post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(endpoint, data, config);
    return response.data;
  }

  async put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(endpoint, data, config);
    return response.data;
  }

  async patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.patch(endpoint, data, config);
    return response.data;
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(endpoint, config);
    return response.data;
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// ============================================================================
// 타입 정의
// ============================================================================

export type InquiryStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED';

export interface GetInquiriesParams {
  status?: InquiryStatus;
  limit?: number;
  offset?: number;
}

export interface Inquiry {
  id: string;
  roomId: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  subject: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
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

export interface Message {
  id: string;
  roomId: string;
  senderType: 'USER' | 'ADMIN';
  senderUserId?: string | null;
  senderAdminId?: string | null;
  content: string;
  createdAt: string;
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

// ============================================================================
// API 함수
// ============================================================================

/**
 * 문의(채팅방) 리스트 조회
 */
export async function getInquiries(
  params?: GetInquiriesParams
): Promise<GetInquiriesResponse> {
  const queryParams = new URLSearchParams();

  if (params?.status) {
    queryParams.append('status', params.status);
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/inquiries${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<GetInquiriesResponse>(endpoint);
}

/**
 * 문의 상세(이력) 조회
 */
export async function getInquiryDetail(
  id: string,
  params?: GetInquiryDetailParams
): Promise<GetInquiryDetailResponse> {
  const queryParams = new URLSearchParams();

  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/inquiries/${id}${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<GetInquiryDetailResponse>(endpoint);
}

/**
 * 문의방 삭제
 */
export async function deleteInquiry(id: string): Promise<DeleteResponse> {
  return apiClient.delete<DeleteResponse>(`/api/admin/inquiries/${id}`);
}

/**
 * 문의 상태 변경
 */
export async function updateInquiryStatus(
  id: string,
  data: UpdateInquiryStatusRequest
): Promise<UpdateInquiryStatusResponse> {
  return apiClient.patch<UpdateInquiryStatusResponse>(
    `/api/admin/inquiries/${id}/status`,
    data
  );
}

/**
 * 문의 메시지 수정
 */
export async function updateMessage(
  inquiryId: string,
  messageId: string,
  data: UpdateMessageRequest
): Promise<UpdateMessageResponse> {
  return apiClient.put<UpdateMessageResponse>(
    `/api/admin/inquiries/${inquiryId}/messages/${messageId}`,
    data
  );
}

/**
 * 문의 메시지 삭제
 */
export async function deleteMessage(
  inquiryId: string,
  messageId: string
): Promise<DeleteResponse> {
  return apiClient.delete<DeleteResponse>(
    `/api/admin/inquiries/${inquiryId}/messages/${messageId}`
  );
}
