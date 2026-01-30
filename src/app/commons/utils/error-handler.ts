import { AxiosError } from 'axios';
import { toast } from 'sonner';

/**
 * API 에러 타입
 */
export interface ApiError {
  message: string;
  status?: number;
  isNetworkError: boolean;
  isAuthError: boolean;
  isNotFound: boolean;
}

/**
 * Axios 에러를 사용자 친화적인 메시지로 변환
 * @param error - Axios 에러 또는 일반 에러
 * @returns 사용자 친화적인 에러 메시지와 메타데이터
 */
export function handleApiError(error: unknown): ApiError {
  // 네트워크 에러 확인
  if (error instanceof AxiosError) {
    // 네트워크 연결 오류
    if (!error.response && error.request) {
      return {
        message: '네트워크 연결을 확인해주세요.',
        isNetworkError: true,
        isAuthError: false,
        isNotFound: false,
      };
    }

    // HTTP 상태 코드별 처리
    const status = error.response?.status;
    const errorData = error.response?.data;

    // 401 인증 에러 (apiClient에서 이미 처리하지만, 추가 정보 제공)
    if (status === 401) {
      return {
        message: '인증이 만료되었습니다. 다시 로그인해주세요.',
        status: 401,
        isNetworkError: false,
        isAuthError: true,
        isNotFound: false,
      };
    }

    // 404 Not Found
    if (status === 404) {
      return {
        message: errorData?.message || '요청한 리소스를 찾을 수 없습니다.',
        status: 404,
        isNetworkError: false,
        isAuthError: false,
        isNotFound: true,
      };
    }

    // 400 Bad Request
    if (status === 400) {
      const message = errorData?.message || '잘못된 요청입니다.';
      return {
        message: Array.isArray(message) ? message.join(', ') : message,
        status: 400,
        isNetworkError: false,
        isAuthError: false,
        isNotFound: false,
      };
    }

    // 500 Server Error
    if (status === 500) {
      return {
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        status: 500,
        isNetworkError: false,
        isAuthError: false,
        isNotFound: false,
      };
    }

    // 기타 HTTP 에러
    return {
      message: errorData?.message || error.message || '요청 처리 중 오류가 발생했습니다.',
      status,
      isNetworkError: false,
      isAuthError: false,
      isNotFound: false,
    };
  }

  // 일반 에러
  if (error instanceof Error) {
    return {
      message: error.message,
      isNetworkError: false,
      isAuthError: false,
      isNotFound: false,
    };
  }

  // 알 수 없는 에러
  return {
    message: '예상치 못한 오류가 발생했습니다.',
    isNetworkError: false,
    isAuthError: false,
    isNotFound: false,
  };
}

/**
 * API 에러를 처리하고 Toast 알림을 표시
 * @param error - Axios 에러 또는 일반 에러
 * @param defaultMessage - 기본 에러 메시지
 * @returns 에러 정보
 */
export function handleApiErrorWithToast(
  error: unknown,
  defaultMessage: string = '요청 처리 중 오류가 발생했습니다.'
): ApiError {
  const apiError = handleApiError(error);
  
  // Toast 알림 표시 (401은 apiClient에서 이미 처리되므로 제외)
  if (!apiError.isAuthError) {
    toast.error(apiError.message || defaultMessage);
  }

  return apiError;
}

/**
 * API 호출을 재시도하는 헬퍼 함수
 * @param fn - 재시도할 함수
 * @param maxRetries - 최대 재시도 횟수 (기본값: 3)
 * @param delay - 재시도 간 지연 시간(ms) (기본값: 1000)
 * @returns 함수 실행 결과
 */
export async function retryApiCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const apiError = handleApiError(error);

      // 재시도하지 않아야 하는 에러 (인증, 404 등)
      if (apiError.isAuthError || apiError.isNotFound || apiError.status === 400) {
        throw error;
      }

      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}
