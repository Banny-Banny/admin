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

// 성능 모니터링 메트릭 타입
export interface SocketMetrics {
  lastConnectTime?: number;
  lastDisconnectTime?: number;
  disconnectReason?: string;
  connectionCount?: number;
  errorCount?: number;
  lastError?: {
    message: string;
    timestamp: number;
  };
  messagesSent?: number;
  lastMessageSentTime?: number;
}

// Window 인터페이스 확장
declare global {
  interface Window {
    __SOCKET_METRICS__?: SocketMetrics;
  }
}

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

export interface AuthenticateRequest {
  token: string;
}

export interface AuthenticateResponse {
  success: boolean;
}

export type MessageHandler = (payload: ReceiveMessagePayload) => void;
export type ReadAlertHandler = (payload: ReadAlertPayload) => void;
export type ErrorHandler = (error: Error) => void;
export type ConnectHandler = () => void;
export type DisconnectHandler = () => void;
export type AuthenticateHandler = (response: AuthenticateResponse) => void;

// ============================================================================
// Socket.IO 클라이언트 클래스
// ============================================================================

export class InquirySocketClient {
  private socket: Socket | null = null;
  private apiBaseUrl: string;
  private isConnected = false;
  private joinedRooms: Set<string> = new Set(); // 입장한 방 목록 추적
  private isReauthenticating = false; // 재인증 중인지 체크
  private reconnectionTimer: NodeJS.Timeout | null = null; // 재연결 타이머
  private messageHandlers: Set<MessageHandler> = new Set(); // 메시지 핸들러 저장
  private readAlertHandlers: Set<ReadAlertHandler> = new Set(); // 읽음 알림 핸들러 저장
  private connectHandlers: Set<ConnectHandler> = new Set(); // 연결 핸들러 저장
  private disconnectHandlers: Set<DisconnectHandler> = new Set(); // 연결 해제 핸들러 저장
  private errorHandlers: Set<ErrorHandler> = new Set(); // 에러 핸들러 저장

  constructor() {
    // 슬래시 중복 방지: URL 끝의 슬래시 제거
    const baseUrl = 
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.API_BASE_URL ||
      'https://be-production-8aa2.up.railway.app';
    
    this.apiBaseUrl = baseUrl.replace(/\/$/, ''); // 마지막 슬래시 제거
  }

  connect(): Socket {
    // 이미 소켓이 존재하고 연결되어 있으면 재사용
    if (this.socket?.connected) {
      console.log('[Socket.IO] 이미 연결된 소켓 재사용');
      return this.socket;
    }

    // 소켓이 존재하지만 연결되지 않은 경우 (재연결 중일 수 있음)
    if (this.socket && !this.socket.disconnected) {
      console.log('[Socket.IO] 소켓이 존재하지만 연결되지 않음, 재연결 대기 중...');
      return this.socket;
    }

    const session = tokenStorage.get();
    const namespace = process.env.NEXT_PUBLIC_SOCKET_NAMESPACE || '/admin-chat';
    const fullUrl = `${this.apiBaseUrl}${namespace}`;
    
    // 디버깅: 실제 접속 주소 확인
    console.log('[Socket.IO] 새 소켓 연결 시도:');
    console.log('  - API Base URL:', this.apiBaseUrl);
    console.log('  - Namespace:', namespace);
    console.log('  - Full URL:', fullUrl);
    console.log('  - 토큰 존재 여부:', !!session?.accessToken);
    console.log('  - 환경 변수 NEXT_PUBLIC_SOCKET_NAMESPACE:', process.env.NEXT_PUBLIC_SOCKET_NAMESPACE || '(기본값 사용)');
    console.log('  - 환경 변수 NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL || '(기본값 사용)');
    
    // 기존 소켓이 있으면 완전히 정리
    if (this.socket) {
      console.log('[Socket.IO] 기존 소켓 정리 중...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    // 토큰 없이도 연결 시도 (재인증 가능) - 문서 스펙에 따라
    this.socket = io(fullUrl, {
      auth: session?.accessToken ? {
        token: session.accessToken,
      } : {},
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      const connectTime = Date.now();
      
      // 디버깅: 연결 성공 로그
      console.log('[Socket.IO] 연결 성공:', {
        url: fullUrl,
        socketId: this.socket?.id,
        connected: this.socket?.connected,
        timestamp: new Date().toISOString(),
      });
      
      // 저장된 핸들러들을 소켓에 등록
      this.messageHandlers.forEach((handler) => {
        const wrappedHandler = (payload: ReceiveMessagePayload) => {
          console.log('[Socket.IO] receive_message 이벤트 수신 (원본):', payload);
          handler(payload);
        };
        this.socket?.on('receive_message', wrappedHandler);
      });
      
      this.readAlertHandlers.forEach((handler) => {
        this.socket?.on('read_alert', handler);
      });
      
      this.disconnectHandlers.forEach((handler) => {
        this.socket?.on('disconnect', handler);
      });
      
      this.errorHandlers.forEach((handler) => {
        this.socket?.on('connect_error', handler);
      });
      
      this.connectHandlers.forEach((handler) => {
        handler();
      });
      
      // 문서 스펙에 따라: 토큰이 없거나 만료되면 5초 유예 후 연결이 종료됨
      // 유예 시간 내에 authenticate 이벤트로 토큰을 다시 보내면 정상 인증됨
      const currentSession = tokenStorage.get();
      if (!currentSession?.accessToken && !this.isReauthenticating) {
        console.log('[Socket.IO] 토큰이 없습니다. 5초 유예 시간 내에 재인증을 시도합니다.');
        this.attemptReauthentication();
      } else if (currentSession?.accessToken && !this.isReauthenticating) {
        // 토큰이 있으면 즉시 재인증 시도 (문서 스펙: 재로그인 직후 권장 흐름)
        console.log('[Socket.IO] 토큰이 있습니다. 즉시 재인증을 시도합니다.');
        this.authenticate(currentSession.accessToken)
          .then(() => {
            console.log('[Socket.IO] 연결 후 즉시 재인증 성공');
          })
          .catch((error) => {
            console.error('[Socket.IO] 연결 후 재인증 실패:', error);
            // 재인증 실패 시 자동 재시도
            if (!this.isReauthenticating) {
              this.attemptReauthentication();
            }
          });
      }
      
      // 성능 모니터링: 연결 시간 기록
      if (typeof window !== 'undefined' && window.__SOCKET_METRICS__) {
        window.__SOCKET_METRICS__.lastConnectTime = connectTime;
        window.__SOCKET_METRICS__.connectionCount = 
          (window.__SOCKET_METRICS__.connectionCount || 0) + 1;
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      const disconnectTime = Date.now();
      
      console.log('[Socket.IO] 연결 해제:', {
        reason,
        timestamp: new Date().toISOString(),
      });
      
      // 저장된 disconnect 핸들러들 호출
      this.disconnectHandlers.forEach((handler) => {
        handler();
      });
      
      // 토큰 만료로 인한 연결 해제 시 재인증 시도
      if (reason === 'io server disconnect' && !this.isReauthenticating) {
        console.log('[Socket.IO] 서버 연결 해제 감지, 재인증을 시도합니다.');
        this.attemptReauthentication();
      }
      
      // 성능 모니터링: 연결 해제 시간 기록
      if (typeof window !== 'undefined' && window.__SOCKET_METRICS__) {
        window.__SOCKET_METRICS__.lastDisconnectTime = disconnectTime;
        window.__SOCKET_METRICS__.disconnectReason = reason;
      }
    });

    this.socket.on('connect_error', (error: Error & { type?: string; description?: string; context?: unknown }) => {
      console.error('[Socket.IO] Connection error:', error);
      console.error('[Socket.IO] 에러 상세 정보:', {
        message: error.message,
        type: error.type || 'unknown',
        description: error.description || 'no description',
        context: error.context || 'no context',
        url: fullUrl,
        timestamp: new Date().toISOString(),
      });
      this.isConnected = false;
      
      // 저장된 error 핸들러들 호출
      this.errorHandlers.forEach((handler) => {
        handler(error);
      });
      
      // 인증 오류인 경우 재인증 시도
      if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
        console.log('[Socket.IO] 인증 오류 감지, 재인증을 시도합니다.');
        this.attemptReauthentication();
      }
      
      // Invalid namespace 오류인 경우 더 명확한 메시지 제공
      if (error.message.includes('Invalid namespace') || error.message.includes('Namespace not found')) {
        console.error(`[Socket.IO] 네임스페이스 오류: ${namespace} 네임스페이스가 서버에서 지원되지 않습니다.`);
        console.error(`[Socket.IO] 서버 URL: ${this.apiBaseUrl}`);
        console.error(`[Socket.IO] 시도한 네임스페이스: ${namespace}`);
        console.error(`[Socket.IO] 전체 URL: ${fullUrl}`);
        console.error(`[Socket.IO] NEXT_PUBLIC_SOCKET_NAMESPACE 환경 변수를 설정하여 다른 네임스페이스를 사용하거나 기본 네임스페이스(/admin-chat)를 사용해주세요.`);
        console.error(`[Socket.IO] 브라우저 개발자 도구의 Network 탭에서 WebSocket 연결을 확인하세요.`);
      }
      
      // 성능 모니터링: 연결 오류 기록
      if (typeof window !== 'undefined' && window.__SOCKET_METRICS__) {
        window.__SOCKET_METRICS__.errorCount = 
          (window.__SOCKET_METRICS__.errorCount || 0) + 1;
        window.__SOCKET_METRICS__.lastError = {
          message: error.message,
          timestamp: Date.now(),
        };
      }
    });

    return this.socket;
  }

  // 재인증 시도 (5초 유예 시간 내에 토큰 재전송)
  private attemptReauthentication(): void {
    if (this.isReauthenticating) {
      console.log('[Socket.IO] 이미 재인증 중입니다.');
      return;
    }

    this.isReauthenticating = true;
    console.log('[Socket.IO] 재인증을 시작합니다. 5초 유예 시간 내에 토큰을 전송합니다.');

    // 재인증 전에 입장했던 방 목록 백업 (재입장용)
    const roomsToRejoin = Array.from(this.joinedRooms);

    // 5초 유예 시간 내에 토큰을 가져와서 재인증 (문서 스펙에 따라)
    // 가능한 빨리 재인증 시도 (서버가 5초 유예를 주는 동안)
    this.reconnectionTimer = setTimeout(() => {
      const session = tokenStorage.get();
      
      if (!session?.accessToken) {
        console.error('[Socket.IO] 재인증 실패: 유효한 토큰을 찾을 수 없습니다. 5초 유예 시간이 지나면 연결이 종료됩니다.');
        this.isReauthenticating = false;
        
        // 연결이 끊어지도록 강제 (5초 후 서버가 끊을 것임)
        // 여기서는 그냥 대기
        return;
      }

      console.log('[Socket.IO] authenticate 이벤트로 토큰 재전송 (5초 유예 시간 내)');
      
      // authenticate 이벤트로 토큰 재전송 (문서 스펙에 따라)
      this.authenticate(session.accessToken)
        .then(() => {
          console.log('[Socket.IO] 재인증 성공');
          this.isReauthenticating = false;
          
          // 재인증 후 이전에 입장했던 방들에 다시 입장
          if (roomsToRejoin.length > 0) {
            console.log(`[Socket.IO] ${roomsToRejoin.length}개 방에 재입장을 시도합니다.`);
            
            // 방 목록 초기화 (중복 방지)
            this.joinedRooms.clear();
            
            // 순차적으로 재입장
            roomsToRejoin.forEach(async (roomId) => {
              try {
                await this.joinRoom(roomId);
                console.log(`[Socket.IO] 방 재입장 성공: ${roomId}`);
              } catch (error) {
                console.error(`[Socket.IO] 방 재입장 실패: ${roomId}`, error);
              }
            });
          }
        })
        .catch((error) => {
          console.error('[Socket.IO] 재인증 실패:', error);
          this.isReauthenticating = false;
          
          // 연결이 끊어지도록 강제
          if (this.socket) {
            this.socket.disconnect();
          }
        });
    }, 1000); // 1초 후 재인증 시도 (5초 유예 내)
  }

  // authenticate 이벤트 전송
  authenticate(token: string): Promise<AuthenticateResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Socket이 연결되지 않았습니다.'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('재인증 요청 시간 초과'));
      }, 5000);

      this.socket.emit(
        'authenticate',
        { token },
        (response: AuthenticateResponse | { error?: string }) => {
          clearTimeout(timeout);
          if ('error' in response && response.error) {
            reject(new Error(response.error || '재인증 실패'));
          } else if ('success' in response && response.success) {
            resolve(response as AuthenticateResponse);
          } else if ('success' in response && !response.success) {
            reject(new Error('재인증 실패: success=false'));
          } else {
            reject(new Error('재인증 응답 형식 오류'));
          }
        }
      );
    });
  }

  disconnect(): void {
    // 재연결 타이머 정리
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.joinedRooms.clear(); // 방 목록 초기화
      this.isReauthenticating = false;
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
            // 방 입장 성공 시 추적
            this.joinedRooms.add(roomId);
            resolve(response as JoinRoomResponse);
          }
        }
      );
    });
  }

  leaveRoom(roomId: string): void {
    if (this.socket && this.isSocketConnected()) {
      this.socket.emit('leave_room', { roomId });
      // 방 나가기 시 추적에서 제거
      this.joinedRooms.delete(roomId);
    }
  }

  sendMessage(roomId: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[Socket.IO] 메시지 전송 시도:', {
        roomId,
        contentLength: content.length,
        isConnected: this.isSocketConnected(),
        socketExists: !!this.socket,
        joinedRooms: Array.from(this.joinedRooms),
        isInRoom: this.joinedRooms.has(roomId),
      });

      if (!this.socket || !this.isSocketConnected()) {
        console.error('[Socket.IO] 메시지 전송 실패: Socket이 연결되지 않았습니다.');
        reject(new Error('Socket이 연결되지 않았습니다.'));
        return;
      }

      // 방에 입장했는지 확인
      if (!this.joinedRooms.has(roomId)) {
        console.error('[Socket.IO] 메시지 전송 실패: 방에 입장하지 않았습니다.', {
          roomId,
          joinedRooms: Array.from(this.joinedRooms),
        });
        reject(new Error(`방에 입장하지 않았습니다. roomId: ${roomId}`));
        return;
      }

      if (content.trim().length === 0) {
        console.error('[Socket.IO] 메시지 전송 실패: 메시지 내용이 비어있습니다.');
        reject(new Error('메시지 내용이 비어있습니다.'));
        return;
      }

      if (content.length > 1500) {
        console.error('[Socket.IO] 메시지 전송 실패: 메시지가 너무 깁니다.');
        reject(new Error('메시지는 최대 1500자까지 입력할 수 있습니다.'));
        return;
      }

      const sendTime = Date.now();
      
      // 에러 핸들러 등록 (한 번만)
      const errorHandler = (error: { message?: string }) => {
        this.socket?.off('error', errorHandler);
        console.error('[Socket.IO] 메시지 전송 중 에러 발생:', error);
        reject(new Error(`메시지 전송 실패: ${error.message || '알 수 없는 오류'}`));
      };
      
      this.socket.once('error', errorHandler);
      
      console.log('[Socket.IO] send_message 이벤트 발송:', { roomId, content });
      
      // 메시지 전송
      this.socket.emit('send_message', { roomId, content }, (response?: { error?: string }) => {
        console.log('[Socket.IO] send_message 응답:', response);
        
        // 콜백이 있는 경우 (서버가 응답하는 경우)
        if (response?.error) {
          this.socket?.off('error', errorHandler);
          console.error('[Socket.IO] 메시지 전송 실패 (서버 응답):', response.error);
          reject(new Error(`메시지 전송 실패: ${response.error}`));
          return;
        }
        
        // 성공 시 에러 핸들러 제거
        this.socket?.off('error', errorHandler);
        
        console.log('[Socket.IO] 메시지 전송 성공');
        
        // 성능 모니터링: 메시지 전송 시간 기록
        if (typeof window !== 'undefined' && window.__SOCKET_METRICS__) {
          window.__SOCKET_METRICS__.messagesSent = 
            (window.__SOCKET_METRICS__.messagesSent || 0) + 1;
          window.__SOCKET_METRICS__.lastMessageSentTime = sendTime;
        }
        
        resolve();
      });
      
      // 콜백이 없는 경우를 대비해 짧은 타임아웃 설정
      // (서버가 콜백을 지원하지 않는 경우)
      setTimeout(() => {
        this.socket?.off('error', errorHandler);
        // 에러가 없었다면 성공으로 간주
        if (typeof window !== 'undefined' && window.__SOCKET_METRICS__) {
          window.__SOCKET_METRICS__.messagesSent = 
            (window.__SOCKET_METRICS__.messagesSent || 0) + 1;
          window.__SOCKET_METRICS__.lastMessageSentTime = sendTime;
        }
        console.log('[Socket.IO] 메시지 전송 타임아웃 (콜백 없음, 성공으로 간주)');
        resolve();
      }, 100);
    });
  }

  sendReadAlert(roomId: string): void {
    if (this.socket && this.isSocketConnected()) {
      this.socket.emit('read_alert', { roomId });
    }
  }

  onReceiveMessage(handler: MessageHandler): void {
    // 핸들러 저장
    this.messageHandlers.add(handler);
    
    // 소켓이 이미 연결되어 있으면 즉시 등록
    if (this.socket && this.isSocketConnected()) {
      const wrappedHandler = (payload: ReceiveMessagePayload) => {
        console.log('[Socket.IO] receive_message 이벤트 수신 (원본):', payload);
        handler(payload);
      };
      this.socket.on('receive_message', wrappedHandler);
    }
  }

  offReceiveMessage(handler?: MessageHandler): void {
    if (handler) {
      // 특정 핸들러 제거
      this.messageHandlers.delete(handler);
      // 소켓에서도 제거 (모든 receive_message 리스너 제거 후 다시 등록)
      if (this.socket) {
        this.socket.off('receive_message');
        // 나머지 핸들러들 다시 등록
        this.messageHandlers.forEach((h) => {
          const wrappedHandler = (payload: ReceiveMessagePayload) => {
            console.log('[Socket.IO] receive_message 이벤트 수신 (원본):', payload);
            h(payload);
          };
          this.socket?.on('receive_message', wrappedHandler);
        });
      }
    } else {
      // 모든 핸들러 제거
      this.messageHandlers.clear();
      if (this.socket) {
        this.socket.off('receive_message');
      }
    }
  }

  onReadAlert(handler: ReadAlertHandler): void {
    // 핸들러 저장
    this.readAlertHandlers.add(handler);
    
    // 소켓이 이미 연결되어 있으면 즉시 등록
    if (this.socket && this.isSocketConnected()) {
      this.socket.on('read_alert', handler);
    }
  }

  offReadAlert(handler?: ReadAlertHandler): void {
    if (handler) {
      this.readAlertHandlers.delete(handler);
      if (this.socket) {
        this.socket.off('read_alert', handler);
      }
    } else {
      this.readAlertHandlers.clear();
      if (this.socket) {
        this.socket.off('read_alert');
      }
    }
  }

  onConnect(handler: ConnectHandler): void {
    // 핸들러 저장
    this.connectHandlers.add(handler);
    
    // 소켓이 이미 연결되어 있으면 즉시 호출
    if (this.socket && this.isSocketConnected()) {
      handler();
    }
  }

  onDisconnect(handler: DisconnectHandler): void {
    // 핸들러 저장
    this.disconnectHandlers.add(handler);
    
    // 소켓이 이미 연결되어 있으면 즉시 등록
    if (this.socket) {
      this.socket.on('disconnect', handler);
    }
  }

  offDisconnect(handler?: DisconnectHandler): void {
    if (handler) {
      this.disconnectHandlers.delete(handler);
      if (this.socket) {
        this.socket.off('disconnect', handler);
      }
    } else {
      this.disconnectHandlers.clear();
      if (this.socket) {
        this.socket.off('disconnect');
      }
    }
  }

  onError(handler: ErrorHandler): void {
    // 핸들러 저장
    this.errorHandlers.add(handler);
    
    // 소켓이 이미 연결되어 있으면 즉시 등록
    if (this.socket) {
      this.socket.on('connect_error', handler);
    }
  }

  offError(handler?: ErrorHandler): void {
    if (handler) {
      this.errorHandlers.delete(handler);
      if (this.socket) {
        this.socket.off('connect_error', handler);
      }
    } else {
      this.errorHandlers.clear();
      if (this.socket) {
        this.socket.off('connect_error');
      }
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // 외부에서 토큰 업데이트를 알림 (로그인 후 호출)
  updateToken(token: string): Promise<AuthenticateResponse> {
    if (this.socket && this.socket.connected) {
      console.log('[Socket.IO] 토큰 업데이트 - 재인증을 시도합니다.');
      return this.authenticate(token);
    } else {
      console.log('[Socket.IO] 토큰 업데이트 - 소켓이 연결되지 않아 연결을 시도합니다.');
      this.connect();
      return Promise.resolve({ success: true });
    }
  }

  // 입장한 방 목록 가져오기
  getJoinedRooms(): string[] {
    return Array.from(this.joinedRooms);
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
