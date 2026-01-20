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

    this.socket = io(`${this.apiBaseUrl}/admin-chat`, {
      auth: {
        token: session.accessToken,
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Socket.IO connected to /admin-chat');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Socket.IO disconnected from /admin-chat');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.isConnected = false;
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
    if (!this.socket || !this.isSocketConnected()) {
      this.connect();
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket이 연결되지 않았습니다.'));
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

    this.socket.emit('send_message', { roomId, content });
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
