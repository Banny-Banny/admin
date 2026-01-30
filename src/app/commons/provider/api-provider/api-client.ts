import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../../utils/token-storage';
import { getInquirySocketClient } from '../../apis/inquiry/socket';

// API 클라이언트 설정
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.API_BASE_URL || 
  'https://be-production-8aa2.up.railway.app';

export class ApiClient {
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
        // 토큰 추가
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

        // 401 에러이고 토큰 갱신이 아직 시도되지 않은 경우
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // 이미 갱신 중이면 대기열에 추가
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
              // 토큰 갱신 API 호출
              const response = await axios.post(`${API_BASE_URL}/api/admin/auth/refresh`, {
                refreshToken: session.refreshToken,
              });

              // 새 토큰 저장
              const newSession = {
                ...session,
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken || session.refreshToken,
              };
              tokenStorage.set(newSession);

              // 토큰 갱신 후 소켓 재인증
              try {
                const socketClient = getInquirySocketClient();
                await socketClient.updateToken(newSession.accessToken);
                console.log('[ApiClient] 토큰 갱신 후 소켓 재인증 완료');
              } catch (socketError) {
                console.error('[ApiClient] 소켓 재인증 실패:', socketError);
                // 소켓 오류는 치명적이지 않으므로 무시
              }

              // 대기 중인 요청 처리
              this.processQueue(null);

              // 원래 요청 재시도
              originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // 토큰 갱신 실패 시 로그아웃 처리
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

export const apiClient = new ApiClient(API_BASE_URL);
