'use client';

import { Search, Filter, MoreVertical, Mail, X, UserPlus, Shield, Edit, Eye, Ban, Unlock, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '@/app/commons/hooks/use-auth';
import { isSuperAdmin } from '@/app/commons/utils/admin-utils';
import { createAdmin, getAdminList, AdminListItem } from '@/app/commons/apis/admin';
import { 
  getUsers, 
  getUserById, 
  updateUser, 
  blockUser, 
  unblockUser, 
  deactivateUser,
  User, 
  UserStatus,
  UpdateUserRequest 
} from '@/app/commons/apis/user';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/commons/components/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/commons/components/alert-dialog';
import styles from "./styles.module.css";

interface AdminFormData {
  name: string;
  email: string;
  password: string;
}

interface UserEditFormData {
  nickname?: string;
  email?: string;
  phoneNumber?: string;
  profileImg?: string;
  isMarketingAgreed?: boolean;
  isPushAgreed?: boolean;
}

export function UsersPage() {
  const { admin } = useAuth();
  
  // 관리자 관련 상태
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  
  // 일반 사용자 관련 상태 (User Story 1)
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<UserStatus>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [userOpenDropdown, setUserOpenDropdown] = useState<string | null>(null);
  
  // 사용자 상세 정보 관련 상태 (User Story 2)
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  
  // 사용자 수정 관련 상태 (User Story 3)
  const [isEditingUser, setIsEditingUser] = useState(false);
  
  // 차단/해제/탈퇴 관련 상태 (User Story 4, 5)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [userToAction, setUserToAction] = useState<User | null>(null);
  

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<AdminFormData>();

  const {
    register: registerUserEdit,
    handleSubmit: handleSubmitUserEdit,
    formState: { errors: userEditErrors },
    reset: resetUserEdit,
    setValue: setUserEditValue,
  } = useForm<UserEditFormData>();

  // 슈퍼 어드민 권한 확인
  const canCreateAdmin = isSuperAdmin(admin);

  // 관리자 목록 조회
  useEffect(() => {
    if (canCreateAdmin) {
      loadAdminList();
    }
  }, [canCreateAdmin]);

  const loadAdminList = async () => {
    try {
      setIsLoadingAdmins(true);
      const response = await getAdminList();
      // createdAt DESC로 정렬 (최신 순)
      const sortedAdmins = (response?.admins || []).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAdmins(sortedAdmins);
    } catch (error: unknown) {
      // 404 에러는 백엔드 API가 아직 구현되지 않은 경우이므로
      // 사용자에게 에러 메시지를 표시하지 않고 콘솔에만 로그
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status === 404) {
        console.warn('Admin list API not found (404). This endpoint may not be implemented yet.');
        setAdmins([]);
      } else {
        console.error('Failed to load admin list:', error);
        toast.error('관리자 목록을 불러오는데 실패했습니다');
        setAdmins([]);
      }
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  // 관리자 생성 핸들러
  const onSubmit = async (data: AdminFormData) => {
    if (!canCreateAdmin) {
      toast.error('관리자 계정을 생성할 권한이 없습니다');
      return;
    }

    try {
      setIsCreatingAdmin(true);
      await createAdmin({
        email: data.email,
        name: data.name,
        password: data.password,
      });

      // 성공 시 목록 새로고침 (실패해도 관리자 생성은 성공했으므로 계속 진행)
      try {
        await loadAdminList();
      } catch (listError) {
        // 목록 새로고침 실패는 무시 (이미 loadAdminList에서 처리됨)
        console.warn('Failed to refresh admin list after creation:', listError);
      }
      
      // 폼 초기화
      reset();
      setShowAdminForm(false);
      
      toast.success('관리자가 추가되었습니다!');
    } catch (error: unknown) {
      console.error('Failed to create admin:', error);
      
      // 에러 처리
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosError.response?.status;
      const errorMessage = axiosError.response?.data?.message || '관리자 추가에 실패했습니다';
      
      if (status === 409) {
        setError('email', {
          type: 'manual',
          message: '이미 사용 중인 이메일입니다',
        });
        toast.error('이미 사용 중인 이메일입니다');
      } else if (status === 403) {
        toast.error('관리자 계정을 생성할 권한이 없습니다');
      } else if (status === 401) {
        toast.error('인증이 필요합니다. 다시 로그인해주세요');
      } else if (status === 400) {
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = (_adminId: string) => {
    if (confirm('정말 이 관리자를 삭제하시겠습니까?')) {
      // TODO: 관리자 삭제 API 구현 시 추가
      toast.info('관리자 삭제 기능은 아직 구현되지 않았습니다');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // 시간 포맷팅
  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // 역할 표시명 변환
  const getRoleDisplayName = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      'SUPER_ADMIN': '최고관리자',
      'ADMIN': '일반관리자',
      'CONTENT_ADMIN': '콘텐츠관리자',
      'CUSTOMER_SUPPORT': '고객지원',
    };
    return roleMap[role] || role;
  };

  // ============================================================================
  // 일반 사용자 목록 조회 (User Story 1)
  // ============================================================================
  
  const loadUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      console.log('🔄 사용자 목록 조회 시작:', {
        search: userSearchTerm || undefined,
        status: userStatusFilter !== 'ALL' ? userStatusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
      });
      
      const response = await getUsers({
        search: userSearchTerm || undefined,
        status: userStatusFilter !== 'ALL' ? userStatusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
      });
      
      console.log('✅ 사용자 목록 조회 성공:', {
        usersCount: response?.users?.length || 0,
        total: response?.total || 0,
        response,
      });
      
      setUsers(response?.users || []);
      setTotalUsers(response?.total || 0);
    } catch (error: unknown) {
      console.error('❌ 사용자 목록 조회 실패:', error);
      
      // 404 에러는 백엔드 API가 아직 구현되지 않은 경우이므로
      // 사용자에게 에러 메시지를 표시하지 않고 콘솔에만 로그
      const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (axiosError?.response?.status === 404) {
        console.warn('⚠️ User list API not found (404). This endpoint may not be implemented yet.');
        setUsers([]);
        setTotalUsers(0);
      } else if (axiosError?.message?.includes('ECONNREFUSED') || axiosError?.message?.includes('Network Error')) {
        console.error('⚠️ 백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
        toast.error('백엔드 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.');
        setUsers([]);
        setTotalUsers(0);
      } else if (axiosError?.response?.status === 400) {
        // 400 에러의 경우 더 자세한 정보 표시
        const errorData = axiosError.response.data;
        let errorMessage = errorData?.message || '사용자 목록을 불러오는데 실패했습니다';
        
        // 필드별 에러가 있는 경우 표시
        if (errorData && typeof errorData === 'object' && 'errors' in errorData) {
          const errors = (errorData as { errors?: Array<{ field: string; message: string }> }).errors;
          if (errors && errors.length > 0) {
            const fieldErrors = errors.map(e => `${e.field}: ${e.message}`).join(', ');
            errorMessage = `입력값 오류: ${fieldErrors}`;
            console.error('필드별 에러:', errors);
          }
        }
        
        console.error('400 에러 상세:', {
          status: axiosError.response.status,
          data: errorData,
          requestParams: {
            search: userSearchTerm || undefined,
            status: userStatusFilter !== 'ALL' ? userStatusFilter : undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            limit: pageSize,
            offset: currentPage * pageSize,
          },
        });
        
        toast.error(errorMessage);
        setUsers([]);
        setTotalUsers(0);
      } else {
        const errorMessage = axiosError?.response?.data?.message || '사용자 목록을 불러오는데 실패했습니다';
        console.error('에러 상세:', {
          status: axiosError?.response?.status,
          message: errorMessage,
          error: axiosError,
        });
        toast.error(errorMessage);
        setUsers([]);
        setTotalUsers(0);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  }, [userSearchTerm, userStatusFilter, startDate, endDate, currentPage, pageSize]);

  // 검색어 디바운싱 (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0); // 검색 시 첫 페이지로 리셋
    }, 500);
    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  // 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(0);
  }, [userStatusFilter, startDate, endDate]);

  // 검색어, 필터, 페이지 변경 시 조회
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearchTerm, userStatusFilter, startDate, endDate, currentPage]);

  // ============================================================================
  // 사용자 상세 정보 조회 (User Story 2)
  // ============================================================================
  
  const handleViewUserDetail = async (user: User) => {
    try {
      const userDetail = await getUserById(user.id);
      setSelectedUser(userDetail);
      setShowUserDetail(true);
      setIsEditingUser(false);
    } catch (error: unknown) {
      console.error('Failed to load user detail:', error);
      toast.error('사용자 정보를 불러오는데 실패했습니다');
    }
  };

  // ============================================================================
  // 사용자 정보 수정 (User Story 3)
  // ============================================================================
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetail(true);
    setIsEditingUser(true);
    // 폼에 현재 값 설정
    setUserEditValue('nickname', user.nickname || '');
    setUserEditValue('email', user.email || '');
    setUserEditValue('phoneNumber', user.phoneNumber || '');
    setUserEditValue('profileImg', user.profileImg || '');
    setUserEditValue('isMarketingAgreed', user.isMarketingAgreed || false);
    setUserEditValue('isPushAgreed', user.isPushAgreed || false);
  };

  const handleUpdateUser = async (data: UserEditFormData) => {
    if (!selectedUser) return;

    try {
      // 빈 문자열을 undefined로 변환하여 백엔드 검증 통과
      const updateData: UpdateUserRequest = {};
      
      // 닉네임: 빈 문자열이면 undefined로 설정 (필드 제외)
      if (data.nickname !== undefined && data.nickname.trim() !== '') {
        updateData.nickname = data.nickname.trim();
      }
      
      // 이메일: 빈 문자열이면 undefined로 설정
      if (data.email !== undefined && data.email.trim() !== '') {
        updateData.email = data.email.trim();
      }
      
      // 전화번호: 빈 문자열이면 undefined로 설정
      if (data.phoneNumber !== undefined && data.phoneNumber.trim() !== '') {
        updateData.phoneNumber = data.phoneNumber.trim();
      }
      
      // 프로필 이미지: 빈 문자열이면 undefined로 설정 (URI 형식 검증 회피)
      if (data.profileImg !== undefined && data.profileImg.trim() !== '') {
        updateData.profileImg = data.profileImg.trim();
      }
      
      // boolean 값은 그대로 전송
      if (data.isMarketingAgreed !== undefined) {
        updateData.isMarketingAgreed = data.isMarketingAgreed;
      }
      if (data.isPushAgreed !== undefined) {
        updateData.isPushAgreed = data.isPushAgreed;
      }

      console.log('📤 전송할 데이터:', updateData);
      console.log('📥 원본 폼 데이터:', data);

      await updateUser(selectedUser.id, updateData);
      toast.success('사용자 정보가 수정되었습니다');
      setIsEditingUser(false);
      await loadUsers(); // 목록 새로고침
      // 상세 정보도 새로고침
      const updatedUser = await getUserById(selectedUser.id);
      setSelectedUser(updatedUser);
    } catch (error: unknown) {
      console.error('❌ 사용자 정보 수정 실패:', error);
      const axiosError = error as { 
        response?: { 
          status?: number; 
          data?: { 
            message?: string;
            errors?: Array<{ field: string; message: string }>;
          } 
        } 
      };
      
      if (axiosError.response?.status === 400) {
        const errorData = axiosError.response.data;
        let errorMessage = errorData?.message || '사용자 정보 수정에 실패했습니다';
        
        // 필드별 에러 메시지가 있으면 표시
        if (errorData?.errors && errorData.errors.length > 0) {
          const fieldErrors = errorData.errors.map(e => `${e.field}: ${e.message}`).join(', ');
          errorMessage = `입력값 오류: ${fieldErrors}`;
        }
        
        console.error('400 에러 상세:', {
          status: axiosError.response.status,
          data: errorData,
        });
        
        toast.error(errorMessage);
      } else {
        const errorMessage = axiosError.response?.data?.message || '사용자 정보 수정에 실패했습니다';
        toast.error(errorMessage);
      }
    }
  };

  // ============================================================================
  // 사용자 차단/해제 (User Story 4)
  // ============================================================================
  
  const handleBlockUser = async () => {
    if (!userToAction) return;

    try {
      await blockUser(userToAction.id);
      toast.success('사용자가 차단되었습니다');
      setBlockDialogOpen(false);
      setUserToAction(null);
      await loadUsers();
    } catch (error: unknown) {
      console.error('Failed to block user:', error);
      toast.error('사용자 차단에 실패했습니다');
    }
  };

  const handleUnblockUser = async () => {
    if (!userToAction) return;

    try {
      await unblockUser(userToAction.id);
      toast.success('사용자 차단이 해제되었습니다');
      setUnblockDialogOpen(false);
      setUserToAction(null);
      await loadUsers();
    } catch (error: unknown) {
      console.error('Failed to unblock user:', error);
      toast.error('사용자 차단 해제에 실패했습니다');
    }
  };

  // ============================================================================
  // 사용자 탈퇴 처리 (User Story 5)
  // ============================================================================
  
  const handleDeactivateUser = async () => {
    if (!userToAction) return;

    try {
      await deactivateUser(userToAction.id);
      toast.success('사용자가 탈퇴 처리되었습니다');
      setDeactivateDialogOpen(false);
      setUserToAction(null);
      await loadUsers();
    } catch (error: unknown) {
      console.error('Failed to deactivate user:', error);
      toast.error('사용자 탈퇴 처리에 실패했습니다');
    }
  };

  // ============================================================================
  // 상태 표시 헬퍼 함수
  // ============================================================================
  
  const getStatusDisplay = (status: UserStatus): string => {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': '활성',
      'INACTIVE': '비활성',
      'BLOCKED': '차단',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: UserStatus): string => {
    switch (status) {
      case 'ACTIVE':
        return styles.statusActive || '';
      case 'BLOCKED':
        return styles.statusWithdrawn || '';
      case 'INACTIVE':
        return styles.statusGuest || '';
      default:
        return styles.statusDefault || '';
    }
  };


  return (
    <div className={styles.c_1j8i8bf}>
      <div className={styles.c_xc8ak4}>
        <div>
          <h2 className={styles.c_1dlkxbt}>사용자 관리</h2>
          <p className={styles.c_9ngaqo}>전체 {totalUsers}명의 사용자</p>
        </div>
        {canCreateAdmin && (
          <button 
            onClick={() => setShowAdminForm(!showAdminForm)}
            className={styles.c_1kx26xi}
            disabled={isCreatingAdmin}
          >
            {showAdminForm ? <X size={20} /> : <UserPlus size={20} />}
            {showAdminForm ? '취소' : '관리자 추가하기'}
          </button>
        )}
      </div>

      {/* 관리자 추가 폼 */}
      {showAdminForm && canCreateAdmin && (
        <div className={styles.c_6422n}>
          <div className={styles.c_5znanu}>
            <Shield className={styles.c_12qcbxf} size={24} />
            <h3 className={styles.c_y1t0l}>새 관리자 추가</h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.c_1j8i8bf}>
            <div className={styles.c_45f187}>
              <div>
                <label className={styles.c_a41skz}>
                  이름 <span className={styles.c_uurwux}>*</span>
                </label>
                <input
                  type="text"
                  {...register('name', {
                    required: '이름을 입력해주세요',
                    minLength: {
                      value: 1,
                      message: '이름을 입력해주세요',
                    },
                  })}
                  placeholder="관리자 이름"
                  className={styles.c_mbvevs}
                />
                {errors.name && (
                  <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className={styles.c_a41skz}>
                  이메일 <span className={styles.c_uurwux}>*</span>
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: '이메일을 입력해주세요',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: '유효한 이메일 형식이 아닙니다',
                    },
                  })}
                  placeholder="admin@example.com"
                  className={styles.c_mbvevs}
                />
                {errors.email && (
                  <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className={styles.c_a41skz}>
                  임시 비밀번호 <span className={styles.c_uurwux}>*</span>
                </label>
                <input
                  type="password"
                  {...register('password', {
                    required: '비밀번호를 입력해주세요',
                    minLength: {
                      value: 8,
                      message: '비밀번호는 최소 8자 이상이어야 합니다',
                    },
                  })}
                  placeholder="최소 8자 이상"
                  className={styles.c_mbvevs}
                />
                {errors.password && (
                  <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className={styles.c_sm9r4r}>
              <button
                type="button"
                onClick={() => {
                  setShowAdminForm(false);
                  reset();
                }}
                className={styles.c_8zbzmp}
                disabled={isCreatingAdmin}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.c_b151g0}
                disabled={isCreatingAdmin}
              >
                {isCreatingAdmin ? '추가 중...' : '관리자 추가'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 관리자 목록 */}
      {canCreateAdmin && (
        <div className={styles.c_4rnbt2}>
          <div className={styles.c_65x7hk}>
            <div className={styles.c_2ca09w}>
              <Shield className={styles.c_53mked} size={20} />
              <h3 className={styles.c_1cmvr70}>관리자 목록</h3>
              <span className={styles.c_1fnqby}>
                {isLoadingAdmins ? '로딩 중...' : `${admins?.length || 0}명`}
              </span>
            </div>
          </div>

          <div className={styles.c_1bb8j67}>
            {isLoadingAdmins ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                관리자 목록을 불러오는 중...
              </div>
            ) : (
              <table className={styles.c_1l2zdph}>
                <thead className={styles.c_z838al}>
                  <tr>
                    <th className={styles.c_wiarv4}>관리자</th>
                    <th className={styles.c_wiarv4}>이메일</th>
                    <th className={styles.c_wiarv4}>권한</th>
                    <th className={styles.c_wiarv4}>가입일</th>
                    <th className={styles.c_wiarv4}>마지막 접속</th>
                    <th className={styles.c_947h7t}>작업</th>
                  </tr>
                </thead>
                <tbody className={styles.c_fyf4x}>
                  {admins && admins.length > 0 ? (
                    admins.map((admin) => (
                      <tr key={admin.id} className={styles.c_x2lcqj}>
                        <td className={styles.c_g43mv3}>
                          <div className={styles.c_2ca09x}>
                            <div className={styles.c_67tbbb}>
                              <Shield size={20} />
                            </div>
                            <div>
                              <p className={styles.c_1my21gc}>{admin.name}</p>
                              <p className={styles.c_1invsyu}>@{admin.email.split('@')[0]}</p>
                            </div>
                          </div>
                        </td>
                        <td className={styles.c_g43mv3}>
                          <p className={styles.c_r4fgsq}>
                            <Mail size={14} />
                            {admin.email}
                          </p>
                        </td>
                        <td className={styles.c_g43mv3}>
                          <span className={styles.c_146yb2l}>
                            {getRoleDisplayName(admin.role)}
                          </span>
                        </td>
                        <td className={styles.c_tp84h0}>{formatDate(admin.createdAt)}</td>
                        <td className={styles.c_tp84h0}>{formatDateTime(admin.lastLoginAt)}</td>
                        <td className={styles.c_1ouo88t}>
                          {admin.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className={styles.c_vage5}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className={styles.c_13nmcpi}>
                        관리자가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 일반 사용자 목록 */}
      <div className={styles.c_4rnbt2}>
        <div className={styles.c_65x7hk}>
          <h3 className={styles.c_1l693jk}>일반 사용자 목록</h3>
          <div className={styles.c_8s05pk}>
            <div className={styles.c_14sfe4c}>
              <Search className={styles.c_1y94mk} size={20} />
              <input
                type="text"
                placeholder="닉네임 또는 이메일로 검색..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className={styles.c_lwq1hq}
              />
            </div>
            <div className={styles.c_2ca09w}>
              <Filter size={16} className={styles.c_1cnlnvv} />
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value as UserStatus)}
                className={styles.c_1fl6ab8}
              >
                <option value="ALL">모든 상태</option>
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
                <option value="BLOCKED">차단</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="시작일"
                className={styles.c_1fl6ab8}
                style={{ maxWidth: '150px' }}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="종료일"
                className={styles.c_1fl6ab8}
                style={{ maxWidth: '150px' }}
              />
            </div>
          </div>
        </div>

        <div className={styles.c_1bb8j67}>
          {isLoadingUsers ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              사용자 목록을 불러오는 중...
            </div>
          ) : (
            <table className={styles.c_1l2zdph}>
              <thead className={styles.c_z838al}>
                <tr>
                  <th className={styles.c_wiarv4}>닉네임</th>
                  <th className={styles.c_wiarv4}>이메일</th>
                  <th className={styles.c_wiarv4}>전화번호</th>
                  <th className={styles.c_wiarv4}>상태</th>
                  <th className={styles.c_wiarv4}>가입일</th>
                  <th className={styles.c_947h7t}>비고</th>
                </tr>
              </thead>
              <tbody className={styles.c_fyf4x}>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className={styles.c_x2lcqj}>
                      <td className={styles.c_g43mv3}>
                        <p className={styles.c_ibg3d3}>{user.nickname || '-'}</p>
                      </td>
                      <td className={styles.c_g43mv3}>
                        <p className={styles.c_r4fgsq}>
                          <Mail size={14} />
                          {user.email}
                        </p>
                      </td>
                      <td className={styles.c_g43mv3}>
                        <p>{user.phoneNumber || '-'}</p>
                      </td>
                      <td className={styles.c_g43mv3}>
                        <span className={`${styles.tagBase || ''} ${getStatusColor(user.status)}`}>
                          {getStatusDisplay(user.status)}
                        </span>
                      </td>
                      <td className={styles.c_tp84h0}>{formatDate(user.createdAt || null)}</td>
                      <td className={styles.c_1ouo88t}>
                        <div className={styles.c_1pv0ki4}>
                          <button 
                            onClick={() => setUserOpenDropdown(userOpenDropdown === user.id ? null : user.id)}
                            className={styles.c_1us4dfh}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {userOpenDropdown === user.id && (
                            <>
                              <div 
                                className={styles.c_1dqnb4u} 
                                onClick={() => setUserOpenDropdown(null)}
                              />
                              <div className={styles.c_1fggrtu}>
                                <div className={styles.c_2c5x}>
                                  <button
                                    onClick={() => {
                                      handleViewUserDetail(user);
                                      setUserOpenDropdown(null);
                                    }}
                                    className={styles.c_1wsrq34}
                                  >
                                    <Eye size={14} />
                                    상세 보기
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleEditUser(user);
                                      setUserOpenDropdown(null);
                                    }}
                                    className={styles.c_1wsrq34}
                                  >
                                    <Edit size={14} />
                                    정보 수정
                                  </button>
                                  {user.status === 'ACTIVE' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setUserToAction(user);
                                          setBlockDialogOpen(true);
                                          setUserOpenDropdown(null);
                                        }}
                                        className={styles.c_1wsrq34}
                                      >
                                        <Ban size={14} />
                                        차단
                                      </button>
                                      <button
                                        onClick={() => {
                                          setUserToAction(user);
                                          setDeactivateDialogOpen(true);
                                          setUserOpenDropdown(null);
                                        }}
                                        className={styles.c_1wsrq34}
                                      >
                                        <Trash2 size={14} />
                                        탈퇴 처리
                                      </button>
                                    </>
                                  )}
                                  {user.status === 'BLOCKED' && (
                                    <button
                                      onClick={() => {
                                        setUserToAction(user);
                                        setUnblockDialogOpen(true);
                                        setUserOpenDropdown(null);
                                      }}
                                      className={styles.c_1wsrq34}
                                    >
                                      <Unlock size={14} />
                                      차단 해제
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.c_13nmcpi}>
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          
          {/* 페이지네이션 */}
          {(totalUsers || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', marginTop: '16px' }}>
              <div>
                {currentPage + 1} / {Math.ceil((totalUsers || 0) / pageSize)} (총 {totalUsers || 0}명)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className={styles.c_8zbzmp}
                >
                  이전
                </button>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={(currentPage + 1) * pageSize >= (totalUsers || 0)}
                  className={styles.c_b151g0}
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 사용자 상세 정보 모달 (User Story 2, 3) */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent style={{ maxWidth: '600px' }}>
          <DialogHeader>
            <DialogTitle>사용자 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <>
              {isEditingUser ? (
                <form onSubmit={handleSubmitUserEdit(handleUpdateUser)}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px' }}>닉네임</label>
                      <input
                        type="text"
                        {...registerUserEdit('nickname', { maxLength: 50 })}
                        className={styles.c_mbvevs}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px' }}>이메일</label>
                      <input
                        type="email"
                        {...registerUserEdit('email', {
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: '유효한 이메일 형식이 아닙니다',
                          },
                        })}
                        className={styles.c_mbvevs}
                      />
                      {userEditErrors.email && (
                        <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                          {userEditErrors.email.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px' }}>전화번호</label>
                      <input
                        type="tel"
                        {...registerUserEdit('phoneNumber', { maxLength: 20 })}
                        className={styles.c_mbvevs}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px' }}>프로필 이미지 URL</label>
                      <input
                        type="url"
                        {...registerUserEdit('profileImg', { maxLength: 500 })}
                        className={styles.c_mbvevs}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          {...registerUserEdit('isMarketingAgreed')}
                        />
                        마케팅 동의
                      </label>
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          {...registerUserEdit('isPushAgreed')}
                        />
                        푸시 알림 동의
                      </label>
                    </div>
                  </div>
                  <DialogFooter>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingUser(false);
                        resetUserEdit();
                      }}
                      className={styles.c_8zbzmp}
                    >
                      취소
                    </button>
                    <button type="submit" className={styles.c_b151g0}>
                      저장
                    </button>
                  </DialogFooter>
                </form>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <strong>닉네임:</strong> {selectedUser.nickname || '-'}
                    </div>
                    <div>
                      <strong>이메일:</strong> {selectedUser.email}
                    </div>
                    <div>
                      <strong>전화번호:</strong> {selectedUser.phoneNumber || '-'}
                    </div>
                    <div>
                      <strong>프로필 이미지:</strong> {selectedUser.profileImg ? (
                        <img src={selectedUser.profileImg} alt="Profile" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                      ) : '-'}
                    </div>
                    <div>
                      <strong>마케팅 동의:</strong> {selectedUser.isMarketingAgreed ? '예' : '아니오'}
                    </div>
                    <div>
                      <strong>푸시 알림 동의:</strong> {selectedUser.isPushAgreed ? '예' : '아니오'}
                    </div>
                    <div>
                      <strong>상태:</strong> {getStatusDisplay(selectedUser.status)}
                    </div>
                    <div>
                      <strong>가입일:</strong> {formatDate(selectedUser.createdAt || null)}
                    </div>
                  </div>
                  <DialogFooter>
                    <button
                      onClick={() => {
                        setShowUserDetail(false);
                        setSelectedUser(null);
                      }}
                      className={styles.c_8zbzmp}
                    >
                      닫기
                    </button>
                    <button
                      onClick={() => handleEditUser(selectedUser)}
                      className={styles.c_b151g0}
                    >
                      편집
                    </button>
                    {selectedUser.status === 'ACTIVE' && (
                      <>
                        <button
                          onClick={() => {
                            setUserToAction(selectedUser);
                            setBlockDialogOpen(true);
                          }}
                          className={styles.c_8zbzmp}
                        >
                          차단
                        </button>
                        <button
                          onClick={() => {
                            setUserToAction(selectedUser);
                            setDeactivateDialogOpen(true);
                          }}
                          className={styles.c_8zbzmp}
                        >
                          탈퇴 처리
                        </button>
                      </>
                    )}
                    {selectedUser.status === 'BLOCKED' && (
                      <button
                        onClick={() => {
                          setUserToAction(selectedUser);
                          setUnblockDialogOpen(true);
                        }}
                        className={styles.c_b151g0}
                      >
                        차단 해제
                      </button>
                    )}
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 차단 확인 다이얼로그 (User Story 4) */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사용자 차단</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 사용자를 차단하시겠습니까? 차단된 사용자는 서비스 이용이 제한됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockUser}>차단</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 차단 해제 확인 다이얼로그 (User Story 4) */}
      <AlertDialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사용자 차단 해제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 사용자의 차단을 해제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblockUser}>차단 해제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 탈퇴 처리 확인 다이얼로그 (User Story 5) */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사용자 탈퇴 처리</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 사용자를 탈퇴 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateUser}>탈퇴 처리</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
