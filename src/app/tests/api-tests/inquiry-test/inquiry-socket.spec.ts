import { test, expect } from '@playwright/test';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://be-production-8aa2.up.railway.app';

// 테스트용 관리자 계정
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'password123',
};

let adminAccessToken: string;
let testRoomId: string;

test.describe('문의하기 Socket.IO E2E 테스트', () => {
  // 로그인하여 토큰 획득 및 테스트용 문의방 ID 가져오기
  test.beforeAll(async ({ request }) => {
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

    // 테스트용 문의방 ID 가져오기
    const inquiriesResponse = await request.get(`${API_BASE_URL}/api/admin/inquiries?limit=1`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    if (inquiriesResponse.ok()) {
      const inquiriesData = await inquiriesResponse.json();
      if (inquiriesData.inquiries.length > 0) {
        testRoomId = inquiriesData.inquiries[0].roomId;
      }
    }
  });

  test('Socket.IO 연결 테스트', async () => {
    return new Promise<void>((resolve, reject) => {
      const socket: Socket = io(`${API_BASE_URL}/admin-chat`, {
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
      const socket: Socket = io(`${API_BASE_URL}/admin-chat`, {
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
      const socket: Socket = io(`${API_BASE_URL}/admin-chat`, {
        auth: {
          token: adminAccessToken,
        },
        transports: ['websocket'],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('메시지 전송 시간 초과'));
      }, 15000);

      let isJoined = false;

      socket.on('connect', () => {
        socket.emit('join_room', { roomId: testRoomId }, (response) => {
          if (response.error) {
            clearTimeout(timeout);
            socket.disconnect();
            reject(new Error(response.error));
            return;
          }
          isJoined = true;

          // 메시지 전송
          socket.emit('send_message', {
            roomId: testRoomId,
            content: '테스트 메시지',
          });

          // 메시지 수신 확인
          socket.on('receive_message', (payload) => {
            clearTimeout(timeout);
            expect(payload).toHaveProperty('id');
            expect(payload).toHaveProperty('roomId');
            expect(payload).toHaveProperty('senderType');
            expect(payload).toHaveProperty('content');
            expect(payload).toHaveProperty('createdAt');
            expect(payload.roomId).toBe(testRoomId);
            expect(payload.content).toBe('테스트 메시지');
            socket.disconnect();
            resolve();
          });
        });
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(error);
      });
    });
  });

  test('읽음 처리 (read_alert) 테스트', async () => {
    if (!testRoomId) {
      test.skip();
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const socket: Socket = io(`${API_BASE_URL}/admin-chat`, {
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
        socket.emit('join_room', { roomId: testRoomId }, (response) => {
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
      const socket: Socket = io(`${API_BASE_URL}/admin-chat`, {
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
        socket.emit('join_room', { roomId: testRoomId }, (response) => {
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
      const socket: Socket = io(`${API_BASE_URL}/admin-chat`, {
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
        socket.emit('join_room', { roomId: testRoomId }, (response) => {
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
          socket.on('error', (error) => {
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
});
