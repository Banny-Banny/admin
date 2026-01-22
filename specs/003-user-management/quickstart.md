# Quick Start: 일반 사용자 관리 기능

**Feature**: 일반 사용자 관리  
**Date**: 2025-01-27

## 개요

이 가이드는 일반 사용자 관리 기능을 빠르게 시작하는 방법을 설명합니다. 관리자가 일반 사용자 목록을 조회하고, 사용자 정보를 수정하며, 사용자를 차단/해제하거나 탈퇴 처리하는 기능을 구현합니다.

## 사전 요구사항

- Node.js 18.x 이상
- Next.js 16.1.3
- React 19.2.3
- 관리자 인증 완료 (로그인 상태)

## 빠른 시작

### 1. API 함수 추가

`src/app/commons/apis/user/index.ts` 파일에 사용자 관리 API 함수들을 추가합니다:

```typescript
// 사용자 상세 정보 조회
export async function getUserById(id: string): Promise<User> {
  return apiClient.get<User>(`/api/admin/users/${id}`);
}

// 사용자 차단
export async function blockUser(id: string): Promise<{ message?: string }> {
  return apiClient.post<{ message?: string }>(`/api/admin/users/${id}/block`);
}

// 사용자 차단 해제
export async function unblockUser(id: string): Promise<{ message?: string }> {
  return apiClient.post<{ message?: string }>(`/api/admin/users/${id}/unblock`);
}

// 사용자 탈퇴 처리
export async function deactivateUser(id: string): Promise<{ message?: string }> {
  return apiClient.post<{ message?: string }>(`/api/admin/users/${id}/deactivate`);
}
```

### 2. UsersPage 컴포넌트 확장

`src/app/components/UsersPage/index.tsx` 파일의 일반 사용자 목록 섹션(496번째 줄 근처)에 다음 기능을 추가합니다:

#### 2.1 상태 관리 추가

```typescript
// 일반 사용자 목록 관련 상태
const [users, setUsers] = useState<User[]>([]);
const [totalUsers, setTotalUsers] = useState(0);
const [currentPage, setCurrentPage] = useState(0);
const [pageSize] = useState(20);
const [isLoadingUsers, setIsLoadingUsers] = useState(false);
const [selectedUser, setSelectedUser] = useState<User | null>(null);
const [showUserDetail, setShowUserDetail] = useState(false);
const [isEditingUser, setIsEditingUser] = useState(false);
```

#### 2.2 사용자 목록 조회 함수

```typescript
const loadUsers = async () => {
  try {
    setIsLoadingUsers(true);
    const response = await getUsers({
      search: searchTerm || undefined,
      status: statusFilter === 'all' ? 'ALL' : statusFilter.toUpperCase() as UserStatus,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: pageSize,
      offset: currentPage * pageSize,
    });
    setUsers(response.users);
    setTotalUsers(response.total);
  } catch (error) {
    console.error('Failed to load users:', error);
    toast.error('사용자 목록을 불러오는데 실패했습니다');
  } finally {
    setIsLoadingUsers(false);
  }
};

// 검색어 디바운싱
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchTerm !== undefined) {
      loadUsers();
    }
  }, 500);
  return () => clearTimeout(timer);
}, [searchTerm]);

// 필터 변경 시 즉시 조회
useEffect(() => {
  loadUsers();
}, [statusFilter, startDate, endDate, currentPage]);
```

#### 2.3 사용자 정보 수정 함수

```typescript
const handleUpdateUser = async (data: UpdateUserRequest) => {
  if (!selectedUser) return;

  try {
    await updateUser(selectedUser.id, data);
    toast.success('사용자 정보가 수정되었습니다');
    setIsEditingUser(false);
    await loadUsers(); // 목록 새로고침
  } catch (error) {
    console.error('Failed to update user:', error);
    toast.error('사용자 정보 수정에 실패했습니다');
  }
};
```

#### 2.4 사용자 차단/해제/탈퇴 함수

```typescript
const handleBlockUser = async (userId: string) => {
  if (!confirm('이 사용자를 차단하시겠습니까?')) return;

  try {
    await blockUser(userId);
    toast.success('사용자가 차단되었습니다');
    await loadUsers();
  } catch (error) {
    console.error('Failed to block user:', error);
    toast.error('사용자 차단에 실패했습니다');
  }
};

const handleUnblockUser = async (userId: string) => {
  if (!confirm('이 사용자의 차단을 해제하시겠습니까?')) return;

  try {
    await unblockUser(userId);
    toast.success('사용자 차단이 해제되었습니다');
    await loadUsers();
  } catch (error) {
    console.error('Failed to unblock user:', error);
    toast.error('사용자 차단 해제에 실패했습니다');
  }
};

const handleDeactivateUser = async (userId: string) => {
  if (!confirm('이 사용자를 탈퇴 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

  try {
    await deactivateUser(userId);
    toast.success('사용자가 탈퇴 처리되었습니다');
    await loadUsers();
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    toast.error('사용자 탈퇴 처리에 실패했습니다');
  }
};
```

### 3. UI 컴포넌트 구현

#### 3.1 사용자 목록 테이블

```typescript
<div className={styles.c_1bb8j67}>
  <table className={styles.c_1l2zdph}>
    <thead>
      <tr>
        <th>닉네임</th>
        <th>이메일</th>
        <th>전화번호</th>
        <th>상태</th>
        <th>가입일</th>
        <th>액션</th>
      </tr>
    </thead>
    <tbody>
      {isLoadingUsers ? (
        <tr>
          <td colSpan={6}>로딩 중...</td>
        </tr>
      ) : users.length === 0 ? (
        <tr>
          <td colSpan={6}>검색 결과가 없습니다</td>
        </tr>
      ) : (
        users.map((user) => (
          <tr key={user.id}>
            <td>{user.nickname || '-'}</td>
            <td>{user.email}</td>
            <td>{user.phoneNumber || '-'}</td>
            <td>
              <Badge variant={user.status === 'ACTIVE' ? 'success' : user.status === 'BLOCKED' ? 'destructive' : 'secondary'}>
                {user.status === 'ACTIVE' ? '활성' : user.status === 'BLOCKED' ? '차단' : '비활성'}
              </Badge>
            </td>
            <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
            <td>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <MoreVertical size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleViewUserDetail(user)}>
                    상세 보기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                    정보 수정
                  </DropdownMenuItem>
                  {user.status === 'ACTIVE' ? (
                    <>
                      <DropdownMenuItem onClick={() => handleBlockUser(user.id)}>
                        차단
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeactivateUser(user.id)}>
                        탈퇴 처리
                      </DropdownMenuItem>
                    </>
                  ) : user.status === 'BLOCKED' ? (
                    <DropdownMenuItem onClick={() => handleUnblockUser(user.id)}>
                      차단 해제
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
```

#### 3.2 페이지네이션

```typescript
<div className={styles.pagination}>
  <button 
    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
    disabled={currentPage === 0}
  >
    이전
  </button>
  <span>
    페이지 {currentPage + 1} / {Math.ceil(totalUsers / pageSize)}
  </span>
  <button 
    onClick={() => setCurrentPage(p => p + 1)}
    disabled={(currentPage + 1) * pageSize >= totalUsers}
  >
    다음
  </button>
</div>
```

#### 3.3 사용자 상세 정보 모달

```typescript
{showUserDetail && selectedUser && (
  <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>사용자 상세 정보</DialogTitle>
      </DialogHeader>
      {isEditingUser ? (
        <form onSubmit={handleSubmit(handleUpdateUser)}>
          {/* 폼 필드들 */}
        </form>
      ) : (
        <div>
          {/* 읽기 전용 정보 표시 */}
        </div>
      )}
    </DialogContent>
  </Dialog>
)}
```

## 주요 기능

### 1. 사용자 목록 조회
- 검색어로 닉네임/이메일 검색 (디바운싱 적용)
- 상태 필터 (ALL, ACTIVE, INACTIVE)
- 날짜 범위 필터 (가입 기간)
- 페이지네이션 (limit/offset)

### 2. 사용자 정보 수정
- 닉네임, 이메일, 전화번호, 프로필 이미지 URL 수정
- 마케팅 동의, 푸시 알림 동의 여부 수정
- React Hook Form으로 유효성 검사

### 3. 사용자 차단/해제
- 활성 사용자 차단
- 차단된 사용자 해제
- 확인 다이얼로그 표시

### 4. 사용자 탈퇴 처리
- 소프트 삭제 방식 (INACTIVE 상태로 변경)
- 확인 다이얼로그 표시
- 되돌릴 수 없음 경고

## 테스트

### E2E 테스트 (Playwright)

```typescript
test('사용자 목록 조회', async ({ page }) => {
  // 관리자 로그인
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // 사용자 목록 페이지로 이동
  await page.goto('/users');
  
  // 목록이 표시되는지 확인
  await expect(page.locator('table')).toBeVisible();
  
  // 검색 기능 테스트
  await page.fill('input[placeholder*="검색"]', 'kim');
  await page.waitForTimeout(600); // 디바운싱 대기
  await expect(page.locator('table tbody tr')).toHaveCount(1);
});
```

## 문제 해결

### API 호출 실패
- 관리자 인증 토큰이 유효한지 확인
- 네트워크 연결 확인
- 백엔드 API 서버 상태 확인

### 검색이 작동하지 않음
- 디바운싱 시간(500ms) 확인
- 검색어가 올바르게 전달되는지 확인
- API 응답 확인

### 페이지네이션이 작동하지 않음
- currentPage 상태 업데이트 확인
- offset 계산 확인
- total 값 확인

## 다음 단계

1. **에러 처리 개선**: 더 상세한 에러 메시지 및 재시도 로직
2. **성능 최적화**: 가상 스크롤링, 무한 스크롤 등
3. **접근성 개선**: 키보드 네비게이션, 스크린 리더 지원
4. **테스트 추가**: 단위 테스트, 통합 테스트

## 참고 자료

- [API 스펙](./contracts/user-management-api.yaml)
- [데이터 모델](./data-model.md)
- [연구 문서](./research.md)
