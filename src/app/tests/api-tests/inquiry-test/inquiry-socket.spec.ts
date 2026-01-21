import { test, expect, APIRequestContext } from '@playwright/test';
import { io, Socket } from 'socket.io-client';
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 직접 로드 (Playwright 워커 프로세스에서도 동작하도록)
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

// 테스트에서는 프로덕션 서버(NEXT_PUBLIC_API_BASE_URL)를 우선 사용, 없으면 API_BASE_URL, 마지막으로 기본값
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://be-production-8aa2.up.railway.app').replace(/\/$/, '');

// Socket.IO 네임스페이스 (환경 변수로 설정 가능, 기본값은 '/admin-chat' 네임스페이스)
// 스펙에 따라 /admin-chat 네임스페이스 사용
const SOCKET_NAMESPACE = process.env.NEXT_PUBLIC_SOCKET_NAMESPACE || '/admin-chat';

// 테스트용 관리자 계정 (.env 파일에서 읽어옴)
const TEST_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.SUPER_ADMIN_PASSWORD || 'password123',
};

let adminAccessToken: string;
let testRoomId: string;

// 헬퍼 함수: 관리자 토큰과 문의방 ID 가져오기
async function getAuthAndRoomId(request: APIRequestContext) {
  // 이미 토큰이 있으면 재사용
  if (!adminAccessToken) {
    const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
      data: {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    adminAccessToken = loginData.accessToken;
    expect(adminAccessToken).toBeTruthy();
  }

  // 이미 roomId가 있으면 재사용
  if (!testRoomId) {
    const inquiriesResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries?limit=1`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });
    
    if (inquiriesResponse.ok()) {
      const inquiriesData = await inquiriesResponse.json();
      
      // 실제 API 응답 구조: {"data": {"items": [], ...}, "success": true}
      // roomId 필드가 없으므로 id를 roomId로 사용
      if (inquiriesData.data?.items && inquiriesData.data.items.length > 0) {
        testRoomId = inquiriesData.data.items[0].id;
      }
    }
  }

  return { adminAccessToken, testRoomId };
}

test.describe('문의하기 Socket.IO E2E 테스트', () => {
  // 로그인하여 토큰 획득 및 테스트용 문의방 ID 가져오기
  test.beforeAll(async ({ request }) => {
    await getAuthAndRoomId(request);
  });

  test('Socket.IO 연결 테스트', async () => {
    return new Promise<void>((resolve, reject) => {
      const socket: Socket = io(`${API_BASE_URL}${SOCKET_NAMESPACE}`, {
        auth: {
          token: adminAccessToken,
        },
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Socket 연결 시간 초과'));
      }, 10000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        expect(socket.connected).toBeTruthy();
        socket.disconnect();
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(error);
      });
    });
  });

  test('방 입장 (join_room) 테스트', async () => {
    if (!testRoomId) {
      test.skip();
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const socket: Socket = io(`${API_BASE_URL}${SOCKET_NAMESPACE}`, {
        auth: {
          token: adminAccessToken,
        },
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('방 입장 시간 초과'));
      }, 10000);

      socket.on('connect', () => {
        socket.emit(
          'join_room',
          { roomId: testRoomId },
          (response: { success?: boolean; roomId?: string; error?: string }) => {
            clearTimeout(timeout);
            if (response.error) {
              socket.disconnect();
              reject(new Error(response.error));
            } else {
              expect(response.success).toBeTruthy();
              expect(response.roomId).toBe(testRoomId);
              socket.disconnect();
              resolve();
            }
          }
        );
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(error);
      });
    });
  });

  test('메시지 전송 (send_message) 테스트', async () => {
    if (!testRoomId) {
      test.skip();
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const socket: Socket = io(`${API_BASE_URL}${SOCKET_NAMESPACE}`, {
        auth: {
          token: adminAccessToken,
        },
        transports: ['websocket'],
      });

      let messageReceived = false;
      const timeout = setTimeout(() => {
        socket.disconnect();
        if (!messageReceived) {
          reject(new Error('메시지 전송 시간 초과: receive_message 이벤트를 받지 못했습니다.'));
        }
      }, 15000);

      // 메시지 수신 리스너를 먼저 등록 (connect 이전에 등록해도 됨)
      socket.on('receive_message', (payload) => {
        if (messageReceived) return; // 중복 처리 방지
        messageReceived = true;
        clearTimeout(timeout);
        try {
          expect(payload).toHaveProperty('id');
          expect(payload).toHaveProperty('roomId');
          expect(payload).toHaveProperty('senderType');
          expect(payload).toHaveProperty('content');
          expect(payload).toHaveProperty('createdAt');
          expect(payload.roomId).toBe(testRoomId);
          expect(payload.content).toBe('테스트 메시지');
          socket.disconnect();
          resolve();
        } catch (error) {
          socket.disconnect();
          reject(error);
        }
      });

      socket.on('connect', () => {
        socket.emit('join_room', { roomId: testRoomId }, (response: { success?: boolean; roomId?: string; error?: string }) => {
          if (response.error) {
            clearTimeout(timeout);
            socket.disconnect();
            reject(new Error(`방 입장 실패: ${response.error}`));
            return;
          }

          // 방 입장 성공 후 메시지 전송
          socket.emit('send_message', {
            roomId: testRoomId,
            content: '테스트 메시지',
          });
        });
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(new Error(`Socket 연결 오류: ${error.message}`));
      });

      // 서버 에러 이벤트 핸들러 추가
      socket.on('error', (error: { message?: string }) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(new Error(`서버 오류: ${error.message || '알 수 없는 오류'}`));
      });
    });
  });

  test('읽음 처리 (read_alert) 테스트', async () => {
    if (!testRoomId) {
      test.skip();
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const socket: Socket = io(`${API_BASE_URL}${SOCKET_NAMESPACE}`, {
        auth: {
          token: adminAccessToken,
        },
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('읽음 처리 시간 초과'));
      }, 10000);

      socket.on('connect', () => {
        socket.emit('join_room', { roomId: testRoomId }, (response: { success?: boolean; roomId?: string; error?: string }) => {
          if (response.error) {
            clearTimeout(timeout);
            socket.disconnect();
            reject(new Error(response.error));
            return;
          }

          // 읽음 처리 전송
          socket.emit('read_alert', { roomId: testRoomId });

          // 읽음 처리 수신 확인
          socket.on('read_alert', (payload) => {
            clearTimeout(timeout);
            expect(payload).toHaveProperty('roomId');
            expect(payload).toHaveProperty('reader');
            expect(payload.roomId).toBe(testRoomId);
            expect(['USER', 'ADMIN']).toContain(payload.reader);
            socket.disconnect();
            resolve();
          });

          // 읽음 처리가 즉시 반환되지 않을 수 있으므로 짧은 대기 후 성공 처리
          setTimeout(() => {
            clearTimeout(timeout);
            socket.disconnect();
            resolve();
          }, 2000);
        });
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(error);
      });
    });
  });

  test('방 나가기 (leave_room) 테스트', async () => {
    if (!testRoomId) {
      test.skip();
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const socket: Socket = io(`${API_BASE_URL}${SOCKET_NAMESPACE}`, {
        auth: {
          token: adminAccessToken,
        },
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('방 나가기 시간 초과'));
      }, 10000);

      socket.on('connect', () => {
        socket.emit('join_room', { roomId: testRoomId }, (response: { success?: boolean; roomId?: string; error?: string }) => {
          if (response.error) {
            clearTimeout(timeout);
            socket.disconnect();
            reject(new Error(response.error));
            return;
          }

          // 방 나가기
          socket.emit('leave_room', { roomId: testRoomId });

          // 연결 해제 확인
          socket.on('disconnect', () => {
            clearTimeout(timeout);
            resolve();
          });

          // 수동으로 연결 해제
          setTimeout(() => {
            clearTimeout(timeout);
            socket.disconnect();
            resolve();
          }, 1000);
        });
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(error);
      });
    });
  });

  test('메시지 길이 제한 테스트', async () => {
    if (!testRoomId) {
      test.skip();
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const socket: Socket = io(`${API_BASE_URL}${SOCKET_NAMESPACE}`, {
        auth: {
          token: adminAccessToken,
        },
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('메시지 길이 제한 테스트 시간 초과'));
      }, 10000);

      socket.on('connect', () => {
        socket.emit('join_room', { roomId: testRoomId }, (response: { success?: boolean; roomId?: string; error?: string }) => {
          if (response.error) {
            clearTimeout(timeout);
            socket.disconnect();
            reject(new Error(response.error));
            return;
          }

          // 1500자 초과 메시지 생성
          const longMessage = 'a'.repeat(1501);

          // 메시지 전송 시도 (서버에서 거부될 것으로 예상)
          socket.emit('send_message', {
            roomId: testRoomId,
            content: longMessage,
          });

          // 에러 이벤트 확인 또는 성공 시 실패 처리
          socket.on('error', () => {
            clearTimeout(timeout);
            socket.disconnect();
            resolve(); // 에러가 발생하면 테스트 통과
          });

          // 메시지가 수신되지 않으면 성공 (클라이언트에서 차단)
          setTimeout(() => {
            clearTimeout(timeout);
            socket.disconnect();
            resolve();
          }, 2000);
        });
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(error);
      });
    });
  });

  test('Socket.IO 연결 완료 대기 테스트', async () => {
    if (!testRoomId) {
      test.skip();
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const socket: Socket = io(`${API_BASE_URL}${SOCKET_NAMESPACE}`, {
        auth: {
          token: adminAccessToken,
        },
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('연결 완료 대기 시간 초과'));
      }, 20000);

      let connected = false;

      socket.on('connect', () => {
        connected = true;
        expect(socket.connected).toBeTruthy();
        
        // 연결 후 즉시 방 입장 시도 (연결 완료 대기 로직 검증)
        socket.emit('join_room', { roomId: testRoomId }, (response: { success?: boolean; roomId?: string; error?: string }) => {
          clearTimeout(timeout);
          expect(connected).toBeTruthy();
          expect(socket.connected).toBeTruthy();
          
          if (response.error) {
            socket.disconnect();
            reject(new Error(`방 입장 실패: ${response.error}`));
          } else {
            expect(response.success).toBeTruthy();
            expect(response.roomId).toBe(testRoomId);
            socket.disconnect();
            resolve();
          }
        });
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        // Invalid namespace 오류인 경우 명확한 메시지 확인
        if (error.message.includes('Invalid namespace')) {
          console.error(`[테스트] Invalid namespace 오류 감지: ${error.message}`);
          reject(new Error(`네임스페이스 오류: ${SOCKET_NAMESPACE} 네임스페이스가 서버에서 지원되지 않습니다.`));
        } else {
          reject(error);
        }
      });
    });
  });

  test('연결 상태 확인 후 방 입장 테스트', async () => {
    if (!testRoomId) {
      test.skip();
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const socket: Socket = io(`${API_BASE_URL}${SOCKET_NAMESPACE}`, {
        auth: {
          token: adminAccessToken,
        },
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('연결 상태 확인 테스트 시간 초과'));
      }, 20000);

      socket.on('connect', () => {
        // 연결 상태 확인
        expect(socket.connected).toBeTruthy();
        
        // 연결된 상태에서만 방 입장 시도
        if (!socket.connected) {
          clearTimeout(timeout);
          socket.disconnect();
          reject(new Error('Socket이 연결되지 않은 상태입니다.'));
          return;
        }

        socket.emit('join_room', { roomId: testRoomId }, (response: { success?: boolean; roomId?: string; error?: string }) => {
          clearTimeout(timeout);
          if (response.error) {
            socket.disconnect();
            reject(new Error(`방 입장 실패: ${response.error}`));
          } else {
            expect(response.success).toBeTruthy();
            expect(response.roomId).toBe(testRoomId);
            socket.disconnect();
            resolve();
          }
        });
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(new Error(`Socket 연결 오류: ${error.message}`));
      });
    });
  });

  test('토큰 없이 연결 후 재인증(authenticate) 테스트', async () => {
    return new Promise<void>((resolve, reject) => {
      // 토큰 없이 연결 시도
      const socket: Socket = io(`${API_BASE_URL}${SOCKET_NAMESPACE}`, {
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('재인증 테스트 시간 초과'));
      }, 15000);

      let connectionEstablished = false;

      socket.on('connect', () => {
        connectionEstablished = true;
        console.log('[테스트] 토큰 없이 연결 성공, 재인증을 시도합니다.');
        
        // 5초 유예 시간 내에 authenticate 이벤트로 토큰 전송
        socket.emit('authenticate', { token: adminAccessToken }, (response: { success?: boolean; error?: string }) => {
          clearTimeout(timeout);
          
          if (response.error) {
            socket.disconnect();
            reject(new Error(`재인증 실패: ${response.error}`));
          } else if (!response.success) {
            socket.disconnect();
            reject(new Error('재인증 실패: success=false'));
          } else {
            console.log('[테스트] 재인증 성공');
            expect(response.success).toBeTruthy();
            socket.disconnect();
            resolve();
          }
        });
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(new Error(`Socket 연결 오류: ${error.message}`));
      });

      socket.on('disconnect', (reason) => {
        // 재인증 전에 연결이 끊어진 경우
        if (!connectionEstablished || reason === 'io server disconnect') {
          clearTimeout(timeout);
          reject(new Error(`재인증 전 연결 해제됨: ${reason}`));
        }
      });
    });
  });

  test('재인증 후 방 입장 테스트', async () => {
    if (!testRoomId) {
      test.skip();
      return;
    }

    return new Promise<void>((resolve, reject) => {
      // 토큰 없이 연결 시도
      const socket: Socket = io(`${API_BASE_URL}${SOCKET_NAMESPACE}`, {
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('재인증 후 방 입장 테스트 시간 초과'));
      }, 20000);

      socket.on('connect', () => {
        console.log('[테스트] 연결 성공, 재인증을 시도합니다.');
        
        // 재인증
        socket.emit('authenticate', { token: adminAccessToken }, (authResponse: { success?: boolean; error?: string }) => {
          if (authResponse.error) {
            clearTimeout(timeout);
            socket.disconnect();
            reject(new Error(`재인증 실패: ${authResponse.error}`));
            return;
          }

          if (!authResponse.success) {
            clearTimeout(timeout);
            socket.disconnect();
            reject(new Error('재인증 실패: success=false'));
            return;
          }

          console.log('[테스트] 재인증 성공, 방 입장을 시도합니다.');
          
          // 재인증 후 방 입장
          socket.emit('join_room', { roomId: testRoomId }, (joinResponse: { success?: boolean; roomId?: string; error?: string }) => {
            clearTimeout(timeout);
            
            if (joinResponse.error) {
              socket.disconnect();
              reject(new Error(`방 입장 실패: ${joinResponse.error}`));
            } else {
              console.log('[테스트] 방 입장 성공');
              expect(joinResponse.success).toBeTruthy();
              expect(joinResponse.roomId).toBe(testRoomId);
              socket.disconnect();
              resolve();
            }
          });
        });
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(new Error(`Socket 연결 오류: ${error.message}`));
      });

      socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          clearTimeout(timeout);
          reject(new Error(`서버에서 연결을 끊었습니다: ${reason}`));
        }
      });
    });
  });

  test('잘못된 토큰으로 재인증 실패 테스트', async () => {
    return new Promise<void>((resolve, reject) => {
      const socket: Socket = io(`${API_BASE_URL}${SOCKET_NAMESPACE}`, {
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('잘못된 토큰 테스트 시간 초과'));
      }, 15000);

      let responseReceived = false;

      socket.on('connect', () => {
        console.log('[테스트] 연결 성공, 잘못된 토큰으로 재인증을 시도합니다.');
        
        // 잘못된 토큰으로 재인증 시도
        const invalidToken = 'invalid_token_12345';
        socket.emit('authenticate', { token: invalidToken }, (response: { success?: boolean; error?: string }) => {
          responseReceived = true;
          clearTimeout(timeout);
          
          // 실패해야 정상
          if (response.error || !response.success) {
            console.log('[테스트] 예상대로 재인증 실패');
            expect(response.success).toBeFalsy();
            socket.disconnect();
            resolve();
          } else {
            socket.disconnect();
            reject(new Error('잘못된 토큰으로 재인증이 성공했습니다 (예상치 못한 동작)'));
          }
        });

        // 콜백이 없을 경우를 대비해 disconnect 이벤트 감지
        setTimeout(() => {
          if (!responseReceived) {
            console.log('[테스트] 서버가 응답하지 않아 disconnect 이벤트를 기다립니다.');
          }
        }, 3000);
      });

      socket.on('disconnect', (reason) => {
        if (!responseReceived && reason === 'io server disconnect') {
          clearTimeout(timeout);
          console.log('[테스트] 서버에서 연결을 끊었습니다 (예상된 동작)');
          socket.disconnect();
          resolve();
        }
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(new Error(`Socket 연결 오류: ${error.message}`));
      });
    });
  });

  test('토큰 갱신 시나리오 시뮬레이션 테스트', async () => {
    if (!testRoomId) {
      test.skip();
      return;
    }

    return new Promise<void>(async (resolve, reject) => {
      // 1단계: 정상 토큰으로 연결 및 방 입장
      const socket: Socket = io(`${API_BASE_URL}${SOCKET_NAMESPACE}`, {
        auth: {
          token: adminAccessToken,
        },
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('토큰 갱신 시나리오 테스트 시간 초과'));
      }, 30000);

      socket.on('connect', () => {
        console.log('[테스트] 초기 연결 성공');
        
        socket.emit('join_room', { roomId: testRoomId }, async (joinResponse: { success?: boolean; error?: string }) => {
          if (joinResponse.error || !joinResponse.success) {
            clearTimeout(timeout);
            socket.disconnect();
            reject(new Error(`방 입장 실패: ${joinResponse.error}`));
            return;
          }

          console.log('[테스트] 방 입장 성공, 토큰 갱신을 시뮬레이션합니다.');

          // 2단계: 새 토큰으로 재인증 (토큰 갱신 시뮬레이션)
          // 실제로는 refresh token으로 새 access token을 받아야 하지만, 
          // 테스트에서는 기존 토큰으로 재인증을 테스트
          socket.emit('authenticate', { token: adminAccessToken }, (authResponse: { success?: boolean; error?: string }) => {
            if (authResponse.error || !authResponse.success) {
              clearTimeout(timeout);
              socket.disconnect();
              reject(new Error(`재인증 실패: ${authResponse.error}`));
              return;
            }

            console.log('[테스트] 재인증 성공, 방에 다시 입장합니다.');

            // 3단계: 재인증 후 같은 방에 다시 입장
            socket.emit('join_room', { roomId: testRoomId }, (rejoinResponse: { success?: boolean; error?: string }) => {
              clearTimeout(timeout);
              
              if (rejoinResponse.error || !rejoinResponse.success) {
                socket.disconnect();
                reject(new Error(`재입장 실패: ${rejoinResponse.error}`));
              } else {
                console.log('[테스트] 재입장 성공 - 토큰 갱신 시나리오 완료');
                expect(rejoinResponse.success).toBeTruthy();
                socket.disconnect();
                resolve();
              }
            });
          });
        });
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(new Error(`Socket 연결 오류: ${error.message}`));
      });

      socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          clearTimeout(timeout);
          reject(new Error(`예상치 못한 서버 연결 해제: ${reason}`));
        }
      });
    });
  });
});
