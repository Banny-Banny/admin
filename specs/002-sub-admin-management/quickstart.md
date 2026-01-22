# Quick Start: 하위 관리자 계정 생성 및 관리 기능 개발

**Feature**: 하위 관리자 계정 생성 및 관리  
**Date**: 2025-01-19

## 개요

이 문서는 슈퍼 어드민이 하위 관리자 계정을 생성하고 관리하는 기능을 구현하기 위한 빠른 시작 가이드입니다.

## 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- 백엔드 API 서버 실행 중
- 환경 변수 설정 (`.env.local`)
- 기존 관리자 인증 기능 (001-admin-auth) 구현 완료

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# 또는 프로덕션 URL
```

## 구현 단계

### 1. API 함수 추가

**파일**: `src/app/commons/apis/admin/index.ts`

기존 파일에 다음 함수들을 추가합니다:

```typescript
// 관리자 목록 조회
export interface AdminListItem {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminListResponse {
  admins: AdminListItem[];
}

/**
 * 관리자 목록 조회
 * @returns 관리자 목록
 */
export async function getAdminList(): Promise<AdminListResponse> {
  return apiClient.get<AdminListResponse>('/api/admin/auth/admins');
}
```

**참고**: `createAdmin` 함수는 이미 존재합니다 (기존 코드 확인).

### 2. UsersPage 컴포넌트 업데이트

**파일**: `src/app/components/UsersPage/index.tsx`

기존 컴포넌트를 백엔드 API와 연동하도록 업데이트합니다:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/commons/hooks/use-auth';
import { createAdmin, getAdminList, AdminListItem } from '@/app/commons/apis/admin';
import { AdminRole } from '@/app/commons/enums';
import { toast } from 'sonner';
// ... 기존 imports

export function UsersPage() {
  const { admin } = useAuth();
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    role: AdminRole.ADMIN,
    password: '',
  });

  // 관리자 목록 조회
  useEffect(() => {
    loadAdminList();
  }, []);

  const loadAdminList = async () => {
    try {
      setIsLoading(true);
      const response = await getAdminList();
      setAdmins(response.admins);
    } catch (error) {
      toast.error('관리자 목록을 불러오는데 실패했습니다');
      console.error('Failed to load admin list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 슈퍼 어드민 권한 확인
  const isSuperAdmin = admin?.role === AdminRole.SUPER_ADMIN;

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSuperAdmin) {
      toast.error('관리자 계정을 생성할 권한이 없습니다');
      return;
    }

    try {
      setIsLoading(true);
      const newAdmin = await createAdmin({
        name: adminFormData.name,
        email: adminFormData.email,
        password: adminFormData.password,
        role: adminFormData.role,
      });

      // Optimistic Update: 목록 재조회
      await loadAdminList();

      // 폼 초기화
      setAdminFormData({
        name: '',
        email: '',
        role: AdminRole.ADMIN,
        password: '',
      });
      setShowAdminForm(false);
      
      toast.success('관리자가 추가되었습니다!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '관리자 추가에 실패했습니다';
      toast.error(errorMessage);
      console.error('Failed to create admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ... 기존 코드 (관리자 목록 표시 등)
  
  return (
    <div className={styles.c_1j8i8bf}>
      {/* 슈퍼 어드민만 관리자 추가 버튼 표시 */}
      {isSuperAdmin && (
        <button 
          onClick={() => setShowAdminForm(!showAdminForm)}
          className={styles.c_1kx26xi}
          disabled={isLoading}
        >
          {showAdminForm ? <X size={20} /> : <UserPlus size={20} />}
          {showAdminForm ? '취소' : '관리자 추가하기'}
        </button>
      )}
      
      {/* 관리자 추가 폼 */}
      {showAdminForm && isSuperAdmin && (
        // ... 기존 폼 코드
      )}
      
      {/* 관리자 목록 */}
      <div className={styles.c_4rnbt2}>
        {/* ... 기존 목록 표시 코드 */}
      </div>
    </div>
  );
}
```

### 3. MarketingPage 컴포넌트 업데이트

**파일**: `src/app/components/MarketingPage/index.tsx`

작성자 정보를 추가하고 권한 기반 수정/삭제를 구현합니다:

```typescript
'use client';

import { useAuth } from '@/app/commons/hooks/use-auth';
import { AdminRole } from '@/app/commons/enums';
// ... 기존 imports

interface Message {
  id: number;
  title: string;
  content: string;
  type: '광고' | '안내' | '이벤트' | '업데이트';
  target: string;
  status: '발송완료' | '발송대기' | '예약';
  sentAt: string;
  recipients: number;
  openRate: number;
  // 추가된 필드
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
}

export function MarketingPage() {
  const { admin } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() => loadMessagesFromStorage());
  
  // ... 기존 코드

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admin) {
      toast.error('로그인이 필요합니다');
      return;
    }
    
    const now = new Date();
    const sentAt = formData.sendNow
      ? `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`
      : `${formData.scheduledDate} ${formData.scheduledTime}`;

    const recipientCount = formData.target === '전체 회원' ? 1523 : formData.target === '활성 회원' ? 982 : 435;

    const newMessage: Message = {
      id: messages.length + 1,
      title: formData.title,
      content: formData.content,
      type: formData.type,
      target: formData.target,
      status: formData.sendNow ? '발송완료' : '예약',
      sentAt: sentAt,
      recipients: recipientCount,
      openRate: formData.sendNow ? Math.random() * 80 : 0,
      // 작성자 정보 추가
      createdBy: admin.id,
      createdByName: admin.name,
      createdAt: now.toISOString(),
    };

    setMessages([newMessage, ...messages]);
    // ... 기존 코드
  };

  // 권한 확인 함수
  const canEditMessage = (message: Message): boolean => {
    if (!admin) return false;
    // 슈퍼 어드민은 모든 메시지 수정 가능
    if (admin.role === AdminRole.SUPER_ADMIN) return true;
    // 작성자만 자신의 메시지 수정 가능
    return message.createdBy === admin.id;
  };

  // ... 기존 코드 (발송 내역 표시 시 작성자 정보 표시)
  
  return (
    <div className={styles.c_1j8i8bf}>
      {/* ... 기존 코드 */}
      
      {/* 발송 내역 탭 */}
      {activeTab === 'history' && (
        <div className={styles.c_4rnbt2}>
          {/* ... 기존 코드 */}
          <table className={styles.c_1l2zdph}>
            <thead>
              <tr>
                <th>메시지</th>
                <th>유형</th>
                <th>발송 대상</th>
                <th>수신자</th>
                <th>오픈률</th>
                <th>상태</th>
                <th>작성자</th> {/* 추가 */}
                <th>발송일시</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((message) => (
                <tr key={message.id}>
                  {/* ... 기존 셀 */}
                  <td>
                    {message.createdByName || '알 수 없음'}
                  </td>
                  {/* ... 기존 셀 */}
                  <td>
                    {canEditMessage(message) && (
                      <button onClick={() => handleEdit(message)}>수정</button>
                      <button onClick={() => handleDelete(message.id)}>삭제</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

### 4. 타입 정의 업데이트

**파일**: `src/app/commons/types/auth.ts` (필요시)

관리자 목록 관련 타입이 필요하면 추가합니다:

```typescript
// AdminListItem은 apis/admin/index.ts에 정의됨
```

## 테스트

### E2E 테스트 작성

**파일**: `src/app/tests/api-tests/admin-test/admin-management.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('관리자 계정 생성 및 관리', () => {
  test.beforeEach(async ({ page }) => {
    // 슈퍼 어드민으로 로그인
    await page.goto('http://localhost:3000');
    // ... 로그인 로직
  });

  test('슈퍼 어드민이 하위 관리자 계정 생성', async ({ page }) => {
    // 관리자 추가 버튼 클릭
    await page.click('text=관리자 추가하기');
    
    // 폼 입력
    await page.fill('input[name="name"]', '홍길동');
    await page.fill('input[name="email"]', 'hong@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.selectOption('select[name="role"]', 'ADMIN');
    
    // 제출
    await page.click('button[type="submit"]');
    
    // 성공 메시지 확인
    await expect(page.locator('text=관리자가 추가되었습니다')).toBeVisible();
    
    // 관리자 목록에 추가 확인
    await expect(page.locator('text=홍길동')).toBeVisible();
  });

  test('일반 관리자는 관리자 추가 버튼이 보이지 않음', async ({ page }) => {
    // 일반 관리자로 로그인
    // ...
    
    // 관리자 추가 버튼이 없음
    await expect(page.locator('text=관리자 추가하기')).not.toBeVisible();
  });
});
```

## 주요 구현 포인트

### 1. 슈퍼 어드민 권한 검증

- **프론트엔드**: UI 제어 (버튼 표시/숨김)
- **백엔드**: 실제 권한 검증 (API 요청 시)

### 2. Optimistic Update

관리자 계정 생성 후 즉시 목록에 표시하고, API 성공 후 서버 데이터로 동기화합니다.

### 3. 에러 처리

- 이메일 중복: 409 응답 처리
- 권한 없음: 403 응답 처리
- 네트워크 오류: Toast 알림

### 4. 작성자 정보

알림/마케팅 메시지에 작성자 정보를 추가하여 권한 기반 수정/삭제를 구현합니다.

## 다음 단계

1. 백엔드 API 구현 확인
2. E2E 테스트 작성 및 실행
3. 에러 케이스 테스트
4. UI/UX 개선

## 참고 문서

- [스펙 문서](./spec.md)
- [데이터 모델](./data-model.md)
- [API 스펙](./contracts/admin-management-api.yaml)
- [기존 관리자 인증 기능](../001-admin-auth/quickstart.md)
