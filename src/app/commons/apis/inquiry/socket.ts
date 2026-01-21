import { io, Socket } from 'socket.io-client';
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
};

// ============================================================================
// 타입 정의
// ============================================================================

export interface JoinRoomRequest {
  roomId: string;
}

export interface JoinRoomResponse {
  success: boolean;
  roomId: string;
}

export interface SendMessageRequest {
  roomId: string;
  content: string;
}

export interface ReceiveMessagePayload {
  id: string;
  roomId: string;
  senderType: 'USER' | 'ADMIN';
  senderUserId?: string | null;
  senderAdminId?: string | null;
  content: string;
  createdAt: string;
}

export interface ReadAlertPayload {
  roomId: string;
  reader: 'USER' | 'ADMIN';
}

export type MessageHandler = (payload: ReceiveMessagePayload) => void;
export type ReadAlertHandler = (payload: ReadAlertPayload) => void;
export type ErrorHandler = (error: Error) => void;
export type ConnectHandler = () => void;
export type DisconnectHandler = () => void;

// ============================================================================
// Socket.IO 클라이언트 클래스
// ============================================================================

export class InquirySocketClient {
  private socket: Socket | null = null;
  private apiBaseUrl: string;
  private isConnected = false;

  constructor() {
    this.apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.API_BASE_URL ||
      'https://be-production-8aa2.up.railway.app';
  }

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const session = tokenStorage.get();
    if (!session?.accessToken) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }

    // Socket.IO 네임스페이스 연결
    // 환경 변수로 네임스페이스를 설정할 수 있으며, 기본값은 '/admin-chat' 네임스페이스
    // 스펙에 따라 /admin-chat 네임스페이스 사용
    const namespace = process.env.NEXT_PUBLIC_SOCKET_NAMESPACE || '/admin-chat';
    this.socket = io(`${this.apiBaseUrl}${namespace}`, {
      auth: {
        token: session.accessToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      const connectTime = Date.now();
      
      // 성능 모니터링: 연결 시간 기록
      if (typeof window !== 'undefined' && (window as any).__SOCKET_METRICS__) {
        (window as any).__SOCKET_METRICS__.lastConnectTime = connectTime;
        (window as any).__SOCKET_METRICS__.connectionCount = 
          ((window as any).__SOCKET_METRICS__.connectionCount || 0) + 1;
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      const disconnectTime = Date.now();
      
      // 성능 모니터링: 연결 해제 시간 기록
      if (typeof window !== 'undefined' && (window as any).__SOCKET_METRICS__) {
        (window as any).__SOCKET_METRICS__.lastDisconnectTime = disconnectTime;
        (window as any).__SOCKET_METRICS__.disconnectReason = reason;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error);
      this.isConnected = false;
      
      // Invalid namespace 오류인 경우 더 명확한 메시지 제공
      if (error.message.includes('Invalid namespace') || error.message.includes('Namespace not found')) {
        console.error(`[Socket.IO] 네임스페이스 오류: ${namespace} 네임스페이스가 서버에서 지원되지 않습니다.`);
        console.error(`[Socket.IO] 서버 URL: ${this.apiBaseUrl}`);
        console.error(`[Socket.IO] 시도한 네임스페이스: ${namespace}`);
        console.error(`[Socket.IO] NEXT_PUBLIC_SOCKET_NAMESPACE 환경 변수를 설정하여 다른 네임스페이스를 사용하거나 기본 네임스페이스(/admin-chat)를 사용해주세요.`);
      }
      
      // 성능 모니터링: 연결 오류 기록
      if (typeof window !== 'undefined' && (window as any).__SOCKET_METRICS__) {
        (window as any).__SOCKET_METRICS__.errorCount = 
          ((window as any).__SOCKET_METRICS__.errorCount || 0) + 1;
        (window as any).__SOCKET_METRICS__.lastError = {
          message: error.message,
          timestamp: Date.now(),
        };
      }
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  async joinRoom(roomId: string): Promise<JoinRoomResponse> {
    // Socket이 없거나 연결되지 않은 경우 연결 시도
    if (!this.socket || !this.isSocketConnected()) {
      this.connect();
      
      // 연결이 완료될 때까지 대기
      await new Promise<void>((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket 초기화 실패'));
          return;
        }

        const connectTimeout = setTimeout(() => {
          reject(new Error('Socket 연결 시간 초과'));
        }, 20000);

        const onConnect = () => {
          clearTimeout(connectTimeout);
          this.socket?.off('connect', onConnect);
          this.socket?.off('connect_error', onError);
          resolve();
        };

        const onError = (error: Error) => {
          clearTimeout(connectTimeout);
          this.socket?.off('connect', onConnect);
          this.socket?.off('connect_error', onError);
          reject(new Error(`Socket 연결 실패: ${error.message}`));
        };

        if (this.socket.connected) {
          clearTimeout(connectTimeout);
          resolve();
        } else {
          this.socket.on('connect', onConnect);
          this.socket.on('connect_error', onError);
        }
      });
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket이 연결되지 않았습니다.'));
        return;
      }

      if (!this.socket.connected) {
        reject(new Error('Socket이 연결되지 않은 상태입니다.'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('방 입장 요청 시간 초과'));
      }, 10000);

      this.socket.emit(
        'join_room',
        { roomId },
        (response: JoinRoomResponse | { error?: string }) => {
          clearTimeout(timeout);
          if ('error' in response) {
            reject(new Error(response.error || '방 입장 실패'));
          } else {
            resolve(response as JoinRoomResponse);
          }
        }
      );
    });
  }

  leaveRoom(roomId: string): void {
    if (this.socket && this.isSocketConnected()) {
      this.socket.emit('leave_room', { roomId });
    }
  }

  sendMessage(roomId: string, content: string): void {
    if (!this.socket || !this.isSocketConnected()) {
      throw new Error('Socket이 연결되지 않았습니다.');
    }

    if (content.trim().length === 0) {
      throw new Error('메시지 내용이 비어있습니다.');
    }

    if (content.length > 1500) {
      throw new Error('메시지는 최대 1500자까지 입력할 수 있습니다.');
    }

    const sendTime = Date.now();
    this.socket.emit('send_message', { roomId, content });
    
    // 성능 모니터링: 메시지 전송 시간 기록
    
    if (typeof window !== 'undefined' && (window as any).__SOCKET_METRICS__) {
      (window as any).__SOCKET_METRICS__.messagesSent = 
        ((window as any).__SOCKET_METRICS__.messagesSent || 0) + 1;
      (window as any).__SOCKET_METRICS__.lastMessageSentTime = sendTime;
    }
  }

  sendReadAlert(roomId: string): void {
    if (this.socket && this.isSocketConnected()) {
      this.socket.emit('read_alert', { roomId });
    }
  }

  onReceiveMessage(handler: MessageHandler): void {
    if (this.socket) {
      this.socket.on('receive_message', handler);
    }
  }

  offReceiveMessage(handler?: MessageHandler): void {
    if (this.socket) {
      if (handler) {
        this.socket.off('receive_message', handler);
      } else {
        this.socket.off('receive_message');
      }
    }
  }

  onReadAlert(handler: ReadAlertHandler): void {
    if (this.socket) {
      this.socket.on('read_alert', handler);
    }
  }

  offReadAlert(handler?: ReadAlertHandler): void {
    if (this.socket) {
      if (handler) {
        this.socket.off('read_alert', handler);
      } else {
        this.socket.off('read_alert');
      }
    }
  }

  onConnect(handler: ConnectHandler): void {
    if (this.socket) {
      this.socket.on('connect', handler);
    }
  }

  onDisconnect(handler: DisconnectHandler): void {
    if (this.socket) {
      this.socket.on('disconnect', handler);
    }
  }

  onError(handler: ErrorHandler): void {
    if (this.socket) {
      this.socket.on('connect_error', handler);
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// ============================================================================
// 싱글톤 인스턴스
// ============================================================================

let socketInstance: InquirySocketClient | null = null;

export function getInquirySocketClient(): InquirySocketClient {
  if (!socketInstance) {
    socketInstance = new InquirySocketClient();
  }
  return socketInstance;
}
