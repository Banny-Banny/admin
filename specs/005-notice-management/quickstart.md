# Quick Start: 공지사항 관리 페이지 개발

**Feature**: 공지사항 관리 페이지  
**Date**: 2026-01-27

## 개요

이 문서는 공지사항 관리 페이지를 구현하기 위한 빠른 시작 가이드입니다. 진행 순서는 API 연결 → E2E 테스트(API 연동 위주) → 데이터 바인딩 → UI 테스트입니다.

## 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- 백엔드 API 서버 실행 중
- 환경 변수 설정 (`.env.local`)
- 관리자 인증 완료 (관리자 API 사용 시 토큰 필요)

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# 또는 프로덕션 URL

# 테스트용 관리자 계정 (E2E 테스트 및 UI 테스트에서만 사용)
TEST_ADMIN_EMAIL=test-admin@example.com
TEST_ADMIN_PASSWORD=test-password123
# 또는
SUPER_ADMIN_EMAIL=test-admin@example.com
SUPER_ADMIN_PASSWORD=test-password123
```

**⚠️ 중요**: 
- 테스트 계정은 **E2E 테스트 및 UI 테스트에서만** 사용합니다
- 실제 구현 코드에서는 테스트 이메일/비밀번호를 사용하지 않습니다
- 실제 사용자 인증은 기존 인증 시스템을 통해 처리합니다

## 구현 단계

### 1. 타입 정의 생성

**파일**: `src/app/commons/types/notice.ts`

```typescript
// 공지사항 엔티티 (상세 조회용)
export interface Notice {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  isPinned: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// 공지사항 목록 항목 (목록 조회용 축약 정보)
export interface NoticeListItem {
  id: string;
  title: string;
  imageUrl: string | null;
  isPinned: boolean;
  createdAt: string;
}

// 공지사항 목록 응답
export interface NoticeListResponse {
  success: boolean;
  data: {
    items: NoticeListItem[];
    total: number;
    limit: number;
    offset: number;
  };
}

// 공지사항 상세 응답
export interface NoticeDetailResponse {
  success: boolean;
  data: Notice;
}

// 공지사항 등록 요청
export interface CreateNoticeRequest {
  title: string;
  content: string;
  imageUrl?: string;
  isPinned?: boolean;
  isVisible?: boolean;
}

// 공지사항 등록 응답
export interface CreateNoticeResponse {
  success: boolean;
  data: Notice;
}

// 공지사항 수정 요청
export interface UpdateNoticeRequest {
  title?: string;
  content?: string;
  imageUrl?: string;
  isPinned?: boolean;
  isVisible?: boolean;
}

// 공지사항 목록 조회 파라미터
export interface GetNoticesParams {
  search?: string;
  limit?: number;
  offset?: number;
}
```

### 2. API 클라이언트 생성

**파일**: `src/app/commons/apis/notice/http.ts`

```typescript
import { apiClient } from '../../provider/api-provider/api-client';
import type {
  Notice,
  NoticeListItem,
  NoticeListResponse,
  NoticeDetailResponse,
  CreateNoticeRequest,
  CreateNoticeResponse,
  UpdateNoticeRequest,
  GetNoticesParams,
} from '../../types/notice';

/**
 * 공지사항 목록 조회 (공개 API)
 * @param params 검색, 페이지네이션 파라미터
 * @returns 공지사항 목록 응답
 */
export async function getNotices(
  params?: GetNoticesParams
): Promise<NoticeListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.search) {
    queryParams.append('search', params.search);
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/notices${queryString ? `?${queryString}` : ''}`;
  
  return apiClient.get<NoticeListResponse>(endpoint);
}

/**
 * 공지사항 상세 조회 (공개 API)
 * @param id 공지사항 ID
 * @returns 공지사항 상세 응답
 */
export async function getNoticeById(id: string): Promise<NoticeDetailResponse> {
  return apiClient.get<NoticeDetailResponse>(`/api/notices/${id}`);
}

/**
 * 공지사항 등록 (관리자 API)
 * @param data 공지사항 등록 데이터
 * @returns 공지사항 등록 응답
 */
export async function createNotice(
  data: CreateNoticeRequest
): Promise<CreateNoticeResponse> {
  return apiClient.post<CreateNoticeResponse>('/api/admin/notices', data);
}

/**
 * 공지사항 정보 수정 (관리자 API)
 * @param id 공지사항 ID
 * @param data 공지사항 수정 데이터
 * @returns 수정 성공 응답
 */
export async function updateNotice(
  id: string,
  data: UpdateNoticeRequest
): Promise<{ success: boolean }> {
  return apiClient.patch<{ success: boolean }>(`/api/admin/notices/${id}`, data);
}

/**
 * 공지사항 삭제 (관리자 API)
 * @param id 공지사항 ID
 * @returns 삭제 성공 응답
 */
export async function deleteNotice(id: string): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/api/admin/notices/${id}`);
}
```

**파일**: `src/app/commons/apis/notice/index.ts`

```typescript
export * from './http';
export * from '../../types/notice';
```

### 3. ReportsPage 컴포넌트 수정

**파일**: `src/app/components/ReportsPage/index.tsx`

```typescript
'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Calendar, User, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getNotices, getNoticeById, createNotice, updateNotice, deleteNotice } from '../../commons/apis/notice';
import type { NoticeListItem, Notice, CreateNoticeRequest, UpdateNoticeRequest } from '../../commons/types/notice';
import styles from './styles.module.css';

export function ReportsPage() {
  const [view, setView] = useState<'list' | 'detail' | 'write'>('list');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [notices, setNotices] = useState<NoticeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    isPinned: false,
    isVisible: true,
  });

  // 공지사항 목록 조회
  useEffect(() => {
    loadNotices();
  }, [searchTerm]);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const response = await getNotices({
        search: searchTerm || undefined,
        limit: 20,
        offset: 0,
      });
      
      if (response.success && response.data) {
        // 고정 공지사항을 상단에 배치
        const sortedNotices = [...response.data.items].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setNotices(sortedNotices);
      }
    } catch (error) {
      console.error('공지사항 목록 조회 실패:', error);
      toast.error('공지사항 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleNoticeClick = async (notice: NoticeListItem) => {
    try {
      setLoading(true);
      const response = await getNoticeById(notice.id);
      if (response.success && response.data) {
        setSelectedNotice(response.data);
        setView('detail');
      }
    } catch (error) {
      console.error('공지사항 상세 조회 실패:', error);
      toast.error('공지사항을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const requestData: CreateNoticeRequest = {
        title: formData.title,
        content: formData.content,
        imageUrl: formData.imageUrl || undefined,
        isPinned: formData.isPinned,
        isVisible: formData.isVisible,
      };

      const response = await createNotice(requestData);
      if (response.success && response.data) {
        toast.success('공지사항이 등록되었습니다');
        setFormData({
          title: '',
          content: '',
          imageUrl: '',
          isPinned: false,
          isVisible: true,
        });
        setView('list');
        loadNotices();
      }
    } catch (error) {
      console.error('공지사항 등록 실패:', error);
      toast.error('공지사항 등록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedNotice) return;

    try {
      setLoading(true);
      const updateData: UpdateNoticeRequest = {
        title: formData.title,
        content: formData.content,
        imageUrl: formData.imageUrl || undefined,
        isPinned: formData.isPinned,
        isVisible: formData.isVisible,
      };

      const response = await updateNotice(selectedNotice.id, updateData);
      if (response.success) {
        toast.success('공지사항이 수정되었습니다');
        setView('detail');
        loadNotices();
        // 상세 정보 다시 조회
        const detailResponse = await getNoticeById(selectedNotice.id);
        if (detailResponse.success && detailResponse.data) {
          setSelectedNotice(detailResponse.data);
        }
      }
    } catch (error) {
      console.error('공지사항 수정 실패:', error);
      toast.error('공지사항 수정에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await deleteNotice(id);
      if (response.success) {
        toast.success('공지사항이 삭제되었습니다');
        setView('list');
        loadNotices();
      }
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      toast.error('공지사항 삭제에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 기존 JSX 유지, API 연동 추가
  // ...
}
```

### 4. E2E 테스트 작성

**파일**: `src/app/tests/api-tests/notice-test/notice-api.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 직접 로드 (Playwright 워커 프로세스에서도 동작하도록)
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

// API_BASE_URL은 절대 URL로 사용해야 함 (Playwright request는 baseURL을 사용하지 않음)
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://be-production-8aa2.up.railway.app').replace(/\/$/, '');

// 테스트용 관리자 계정 (.env 파일에서 읽어옴)
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || 'password123',
};

let adminAccessToken: string;
let createdNoticeId: string | null = null;

test.describe('공지사항 관리 API E2E 테스트', () => {
  // 로그인하여 토큰 획득
  test.beforeAll(async ({ request }) => {
    // 환경 변수 확인 (디버깅용)
    if (!TEST_ADMIN.email || !TEST_ADMIN.password) {
      console.error('환경 변수가 설정되지 않았습니다:', {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password ? '***' : undefined,
        envEmail: process.env.TEST_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL,
        envPassword: (process.env.TEST_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD) ? '***' : undefined,
      });
    }

    const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
      data: {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
      },
    });

    if (!loginResponse.ok()) {
      const errorBody = await loginResponse.text();
      console.error('로그인 실패:', {
        status: loginResponse.status(),
        statusText: loginResponse.statusText(),
        requestUrl: `${API_BASE_URL}/api/admin/auth/login`,
        actualUrl: loginResponse.url(),
        body: errorBody.substring(0, 200),
        email: TEST_ADMIN.email,
      });
    }

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    adminAccessToken = loginData.accessToken;
    expect(adminAccessToken).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    // 테스트로 생성한 공지사항 삭제
    if (createdNoticeId) {
      await request.delete(`${API_BASE_URL}/api/admin/notices/${createdNoticeId}`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });
    }
  });

  test('공지사항 목록 조회 (공개 API)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/notices`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('items');
    expect(data.data).toHaveProperty('total');
    expect(data.data).toHaveProperty('limit');
    expect(data.data).toHaveProperty('offset');
    expect(Array.isArray(data.data.items)).toBeTruthy();
  });

  test('공지사항 상세 조회 (공개 API)', async ({ request }) => {
    // 먼저 공지사항 목록을 조회하여 ID 획득
    const listResponse = await request.get(`${API_BASE_URL}/api/notices`);
    const listData = await listResponse.json();
    const noticeId = listData.data.items[0]?.id;
    
    if (!noticeId) {
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE_URL}/api/notices/${noticeId}`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(noticeId);
    expect(data.data).toHaveProperty('title');
    expect(data.data).toHaveProperty('content');
  });

  test('공지사항 등록 (관리자 API)', async ({ request }) => {
  const noticeData = {
    title: '테스트 공지사항',
    content: '테스트 내용입니다.',
    isPinned: false,
    isVisible: true,
  };

  const response = await request.post(`${API_BASE_URL}/api/admin/notices`, {
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
      'Content-Type': 'application/json',
    },
    data: noticeData,
  });

    if (!response.ok()) {
      const errorBody = await response.text();
      console.error('공지사항 등록 실패:', {
        status: response.status(),
        statusText: response.statusText(),
        body: errorBody.substring(0, 500),
        requestData: noticeData,
      });
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.title).toBe(noticeData.title);
    expect(data.data.content).toBe(noticeData.content);
    
    // 생성된 공지사항 ID 저장 (삭제용)
    createdNoticeId = data.data.id;
    expect(createdNoticeId).toBeTruthy();
  });

  test('공지사항 수정 (관리자 API)', async ({ request }) => {
  // POST로 생성한 데이터가 있을 경우에만 테스트 진행
  if (!createdNoticeId) {
    test.skip();
    return;
  }

  const updateData = {
    title: '수정된 제목',
    isPinned: true,
  };

  const response = await request.patch(`${API_BASE_URL}/api/admin/notices/${createdNoticeId}`, {
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
      'Content-Type': 'application/json',
    },
    data: updateData,
  });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('공지사항 삭제 (관리자 API)', async ({ request }) => {
  // POST로 생성한 데이터가 있을 경우에만 테스트 진행
  if (!createdNoticeId) {
    test.skip();
    return;
  }

  const response = await request.delete(`${API_BASE_URL}/api/admin/notices/${createdNoticeId}`, {
    headers: {
      Authorization: `Bearer ${adminAccessToken}`,
    },
  });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    
    // 삭제 후 ID 초기화
    createdNoticeId = null;
  });
});
```

## 테스트 실행

### E2E 테스트 실행

```bash
npm run test:e2e
```

### 개발 서버 실행

```bash
npm run dev
```

## 다음 단계

1. 공지사항 수정 UI 추가
2. 페이지네이션 구현
3. 이미지 업로드 기능 추가
4. 에러 처리 개선
5. 로딩 상태 UI 개선
6. UI 테스트 작성

## 참고 자료

- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [Axios 문서](https://axios-http.com/)
- [Playwright 문서](https://playwright.dev/)
- [OpenAPI 스펙](./contracts/admin-notices-api.yaml)

## 주의사항

- **테스트 계정 사용**: E2E 테스트 및 UI 테스트에서만 테스트 계정(`TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`)을 사용합니다. 실제 구현 코드에서는 테스트 계정을 사용하지 않습니다.
- PATCH와 DELETE 테스트는 POST로 생성한 데이터가 있을 경우에만 진행합니다
- 공개 API(GET /api/notices, GET /api/notices/{id})는 인증 토큰이 필요하지 않습니다
- 관리자 API(POST, PATCH, DELETE)는 인증 토큰이 필요합니다
- API 응답에 없는 필드(author, views)는 UI에서 처리합니다
