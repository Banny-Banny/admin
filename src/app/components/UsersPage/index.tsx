import { Search, Filter, MoreVertical, Mail, X, UserPlus, Shield } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import styles from "./styles.module.css";
import { getUsers, type User, type UserStatus, type GetUsersResponse } from '../../commons/apis/user';
import { createAdmin, getAdmins, type AdminListItem } from '../../commons/apis/admin';

// UI에서 사용하는 유저 타입 (API 타입 + 추가 필드)
interface UserWithUI extends User {
  platform?: string; // 플랫폼 정보 (API에 없을 수 있음)
  lastLogin?: string; // 마지막 접속 (API에 없을 수 있음)
}

// UI 상태 타입
type UIStatus = '정상' | '비회원' | '탈퇴';

// 상태 매핑 함수
const mapApiStatusToUI = (status: UserStatus): UIStatus => {
  switch (status) {
    case 'ACTIVE':
      return '정상';
    case 'INACTIVE':
      return '비회원';
    default:
      return '정상';
  }
};

const mapUIStatusToAPI = (status: string): UserStatus | undefined => {
  switch (status) {
    case '정상':
      return 'ACTIVE';
    case '비회원':
    case '탈퇴':
      return 'INACTIVE';
    default:
      return undefined;
  }
};

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [admins, setAdmins] = useState<Array<{
    id: string | number;
    name: string;
    nickname: string;
    email: string;
    role: string;
    joinDate: string;
    lastLogin: string;
  }>>([]);

  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    role: '일반관리자',
    password: '',
  });

  const [users, setUsers] = useState<UserWithUI[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // 검색어 debounce 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms 지연

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 유저 목록 조회 함수
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiStatus = mapUIStatusToAPI(statusFilter);
      const response = await getUsers({
        search: debouncedSearchTerm || undefined,
        status: apiStatus,
        limit: 100, // 충분히 큰 값으로 설정
        offset: 0,
      });
      
      // 실제 API 응답 구조에 맞게 처리
      // 응답이 { success: true, data: { items: [...], total: ... } } 형태일 수 있음
      let usersList: User[] = [];
      let total = 0;
      
      // 응답을 unknown으로 처리하여 타입 안전하게 처리
      const responseUnknown = response as unknown;
      
      // 기대하는 구조: { users: [...], total: ... }
      if (
        typeof responseUnknown === 'object' &&
        responseUnknown !== null &&
        'users' in responseUnknown &&
        Array.isArray((responseUnknown as GetUsersResponse).users)
      ) {
        const typedResponse = responseUnknown as GetUsersResponse;
        usersList = typedResponse.users;
        total = typedResponse.total || 0;
      }
      // 실제 API 구조: { success: true, data: { items: [...], total: ... } }
      else if (
        typeof responseUnknown === 'object' &&
        responseUnknown !== null &&
        'data' in responseUnknown &&
        typeof (responseUnknown as { data: unknown }).data === 'object' &&
        (responseUnknown as { data: unknown }).data !== null
      ) {
        const dataObj = (responseUnknown as { data: { items?: User[]; total?: number } }).data;
        if (Array.isArray(dataObj.items)) {
          usersList = dataObj.items;
          total = dataObj.total || 0;
        }
      }
      // 배열로 직접 반환되는 경우
      else if (Array.isArray(responseUnknown)) {
        usersList = responseUnknown;
        total = responseUnknown.length;
      }
      
      // API 응답을 UI 타입으로 변환
      const usersWithUI: UserWithUI[] = usersList.map((user) => ({
        ...user,
        platform: '일반', // API에 플랫폼 정보가 없으면 기본값
        lastLogin: user.updatedAt || user.createdAt || '-',
      }));
      
      setUsers(usersWithUI);
      setTotalUsers(total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '유저 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('Failed to fetch users:', err);
      // 에러 발생 시 빈 배열로 설정
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter]);

  // 관리자 목록 조회 함수
  const fetchAdmins = useCallback(async () => {
    try {
      const response = await getAdmins({
        status: 'ALL',
        limit: 100,
        offset: 0,
      });
      
      // API 응답 구조에 맞게 처리
      let adminsList: AdminListItem[] = [];
      
      const responseUnknown = response as unknown;
      
      // 응답이 { admins: [...] } 형태인 경우
      if (
        typeof responseUnknown === 'object' &&
        responseUnknown !== null &&
        'admins' in responseUnknown &&
        Array.isArray((responseUnknown as { admins: AdminListItem[] }).admins)
      ) {
        adminsList = (responseUnknown as { admins: AdminListItem[] }).admins;
      }
      // 응답이 { items: [...] } 형태인 경우
      else if (
        typeof responseUnknown === 'object' &&
        responseUnknown !== null &&
        'items' in responseUnknown &&
        Array.isArray((responseUnknown as { items: AdminListItem[] }).items)
      ) {
        adminsList = (responseUnknown as { items: AdminListItem[] }).items;
      }
      // 응답이 { success: true, data: { items: [...] } } 형태인 경우
      else if (
        typeof responseUnknown === 'object' &&
        responseUnknown !== null &&
        'data' in responseUnknown &&
        typeof (responseUnknown as { data: unknown }).data === 'object' &&
        (responseUnknown as { data: unknown }).data !== null
      ) {
        const dataObj = (responseUnknown as { data: { items?: AdminListItem[]; admins?: AdminListItem[] } }).data;
        if (Array.isArray(dataObj.items)) {
          adminsList = dataObj.items;
        } else if (Array.isArray(dataObj.admins)) {
          adminsList = dataObj.admins;
        }
      }
      // 배열로 직접 반환되는 경우
      else if (Array.isArray(responseUnknown)) {
        adminsList = responseUnknown;
      }
      
      // API 응답을 UI 타입으로 변환
      const adminsWithUI = adminsList.map((admin) => ({
        id: admin.id,
        name: admin.name,
        nickname: admin.email.split('@')[0],
        email: admin.email,
        role: admin.role === 'SUPER_ADMIN' ? '최고관리자' : 
              admin.role === 'ADMIN' ? '일반관리자' : 
              '일반관리자',
        joinDate: admin.createdAt 
          ? new Date(admin.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        lastLogin: admin.lastLogin || '-',
      }));
      
      setAdmins(adminsWithUI);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
      // 에러 발생 시 빈 배열로 설정
      setAdmins([]);
    }
  }, []);

  // 초기 로드 및 필터 변경 시 데이터 조회
  useEffect(() => {
    fetchUsers();
    fetchAdmins();
  }, [fetchUsers, fetchAdmins]);

  const handleStatusChange = async (userId: string, newStatus: UIStatus) => {
    // TODO: 유저 상태 변경 API가 있으면 여기서 호출
    // 현재는 로컬 상태만 업데이트
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: mapUIStatusToAPI(newStatus) || 'ACTIVE' } : user
    ));
    setOpenDropdown(null);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    
    try {
      await createAdmin({
        email: adminFormData.email,
        name: adminFormData.name,
        password: adminFormData.password,
      });

      // 관리자 추가 성공 후 목록 다시 불러오기
      await fetchAdmins();
      
      setAdminFormData({
        name: '',
        email: '',
        role: '일반관리자',
        password: '',
      });
      setShowAdminForm(false);
      alert('관리자가 추가되었습니다!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '관리자 추가에 실패했습니다.';
      setError(errorMessage);
      alert(errorMessage);
      console.error('Failed to create admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = (adminId: string | number) => {
    if (confirm('정말 이 관리자를 삭제하시겠습니까?')) {
      setAdmins(admins.filter(admin => admin.id !== adminId));
    }
  };

  // 클라이언트 사이드 필터링 (플랫폼 필터만, 검색과 상태는 API에서 처리)
  const filteredUsers = users.filter(user => {
    const matchesPlatform = platformFilter === 'all' || user.platform === platformFilter;
    return matchesPlatform;
  });

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      '카카오': '💬',
      '네이버': 'N',
      '구글': 'G',
      '일반': '✉️',
    };
    return icons[platform] || '•';
  };

  const getStatusColor = (status: UserStatus) => {
    const uiStatus = mapApiStatusToUI(status);
    switch (uiStatus) {
      case '정상':
        return styles.statusActive;
      case '비회원':
        return styles.statusGuest;
      case '탈퇴':
        return styles.statusWithdrawn;
      default:
        return styles.statusDefault;
    }
  };

  return (
    <div className={styles.c_1j8i8bf}>
      <div className={styles.c_xc8ak4}>
        <div>
          <h2 className={styles.c_1dlkxbt}>사용자 관리</h2>
          <p className={styles.c_9ngaqo}>전체 {totalUsers}명의 사용자</p>
        </div>
        <button 
          onClick={() => setShowAdminForm(!showAdminForm)}
          className={styles.c_1kx26xi}
        >
          {showAdminForm ? <X size={20} /> : <UserPlus size={20} />}
          {showAdminForm ? '취소' : '관리자 추가하기'}
        </button>
      </div>

      {/* 관리자 추가 폼 */}
      {showAdminForm && (
        <div className={styles.c_6422n}>
          <div className={styles.c_5znanu}>
            <Shield className={styles.c_12qcbxf} size={24} />
            <h3 className={styles.c_y1t0l}>새 관리자 추가</h3>
          </div>

          <form onSubmit={handleAdminSubmit} className={styles.c_1j8i8bf}>
            <div className={styles.c_45f187}>
              <div>
                <label className={styles.c_a41skz}>
                  이름 <span className={styles.c_uurwux}>*</span>
                </label>
                <input
                  type="text"
                  value={adminFormData.name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                  required
                  placeholder="관리자 이름"
                  className={styles.c_mbvevs}
                />
              </div>

              <div>
                <label className={styles.c_a41skz}>
                  이메�� <span className={styles.c_uurwux}>*</span>
                </label>
                <input
                  type="email"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  required
                  placeholder="admin@example.com"
                  className={styles.c_mbvevs}
                />
              </div>

              <div>
                <label className={styles.c_a41skz}>
                  권한 <span className={styles.c_uurwux}>*</span>
                </label>
                <select
                  value={adminFormData.role}
                  onChange={(e) => setAdminFormData({ ...adminFormData, role: e.target.value })}
                  required
                  className={styles.c_mbvevs}
                >
                  <option value="일반관리자">일반관리자</option>
                  <option value="최고관리자">최고관리자</option>
                  <option value="콘텐츠관리자">콘텐츠관리자</option>
                  <option value="고객지원">고객지원</option>
                </select>
              </div>

              <div>
                <label className={styles.c_a41skz}>
                  임시 비밀번호 <span className={styles.c_uurwux}>*</span>
                </label>
                <input
                  type="password"
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                  required
                  placeholder="최소 8자 이상"
                  minLength={8}
                  className={styles.c_mbvevs}
                />
              </div>
            </div>

            <div className={styles.c_sm9r4r}>
              <button
                type="button"
                onClick={() => setShowAdminForm(false)}
                className={styles.c_8zbzmp}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.c_b151g0}
              >
                관리자 추가
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 관리자 목록 */}
      <div className={styles.c_4rnbt2}>
        <div className={styles.c_65x7hk}>
          <div className={styles.c_2ca09w}>
            <Shield className={styles.c_53mked} size={20} />
            <h3 className={styles.c_1cmvr70}>관리자 목록</h3>
            <span className={styles.c_1fnqby}>
              {admins.length}명
            </span>
          </div>
        </div>

        <div className={styles.c_1bb8j67}>
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
              {admins.map((admin) => (
                <tr key={admin.id} className={styles.c_x2lcqj}>
                  <td className={styles.c_g43mv3}>
                    <div className={styles.c_2ca09x}>
                      <div className={styles.c_67tbbb}>
                        <Shield size={20} />
                      </div>
                      <div>
                        <p className={styles.c_1my21gc}>{admin.name}</p>
                        <p className={styles.c_1invsyu}>@{admin.nickname}</p>
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
                      {admin.role}
                    </span>
                  </td>
                  <td className={styles.c_tp84h0}>{admin.joinDate}</td>
                  <td className={styles.c_tp84h0}>{admin.lastLogin}</td>
                  <td className={styles.c_1ouo88t}>
                    {admin.role !== '최고관리자' && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className={styles.c_vage5}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 일반 사용자 목록 */}
      <div className={styles.c_4rnbt2}>
        <div className={styles.c_65x7hk}>
          <h3 className={styles.c_1l693jk}>일반 사용자 목록</h3>
          <div className={styles.c_8s05pk}>
            <div className={styles.c_14sfe4c}>
              <Search className={styles.c_1y94mk} size={20} />
              <input
                type="text"
                placeholder="이름, 닉네임 또는 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.c_lwq1hq}
              />
            </div>
            <div className={styles.c_2ca09w}>
              <Filter size={16} className={styles.c_1cnlnvv} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.c_1fl6ab8}
              >
                <option value="all">모든 상태</option>
                <option value="정상">정상</option>
                <option value="비회원">비회원</option>
                <option value="탈퇴">탈퇴</option>
              </select>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className={styles.c_1fl6ab8}
              >
                <option value="all">모든 플랫폼</option>
                <option value="일반">일반</option>
                <option value="카카오">카카오</option>
                <option value="네이버">네이버</option>
                <option value="구글">구글</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.c_1bb8j67}>
          <table className={styles.c_1l2zdph}>
            <thead className={styles.c_z838al}>
              <tr>
                <th className={styles.c_wiarv4}>사용자</th>
                <th className={styles.c_wiarv4}>닉네임</th>
                <th className={styles.c_wiarv4}>이메일</th>
                <th className={styles.c_wiarv4}>플랫폼</th>
                <th className={styles.c_wiarv4}>상태</th>
                <th className={styles.c_wiarv4}>가입일</th>
                <th className={styles.c_wiarv4}>마지막 접속</th>
                <th className={styles.c_947h7t}>작업</th>
              </tr>
            </thead>
            <tbody className={styles.c_fyf4x}>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className={styles.c_13nmcpi}>
                    로딩 중...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className={styles.c_13nmcpi}>
                    {error}
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const uiStatus = mapApiStatusToUI(user.status);
                  const joinDate = user.createdAt 
                    ? new Date(user.createdAt).toISOString().split('T')[0]
                    : '-';
                  
                  return (
                    <tr key={user.id} className={styles.c_x2lcqj}>
                      <td className={styles.c_g43mv3}>
                        <div className={styles.c_2ca09x}>
                          <div className={styles.c_1oa1gq1}>
                            {(user.name || user.nickname || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={styles.c_1my21gc}>{user.name || user.nickname || '이름 없음'}</p>
                          </div>
                        </div>
                      </td>
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
                        <span className={styles.c_a0rzae}>
                          <span>{getPlatformIcon(user.platform || '일반')}</span>
                          {user.platform || '일반'}
                        </span>
                      </td>
                      <td className={styles.c_g43mv3}>
                        <span className={`${styles.tagBase} ${getStatusColor(user.status)}`}>
                          {uiStatus}
                        </span>
                      </td>
                      <td className={styles.c_tp84h0}>{joinDate}</td>
                      <td className={styles.c_tp84h0}>{user.lastLogin || '-'}</td>
                      <td className={styles.c_1ouo88t}>
                        <div className={styles.c_1pv0ki4}>
                          <button 
                            onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                            className={styles.c_1us4dfh}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {openDropdown === user.id && (
                            <>
                              <div 
                                className={styles.c_1dqnb4u} 
                                onClick={() => setOpenDropdown(null)}
                              />
                              <div className={styles.c_1fggrtu}>
                                <div className={styles.c_2c5x}>
                                  <div className={styles.c_a3mzhn}>
                                    상태 변경
                                  </div>
                                  <button
                                    onClick={() => handleStatusChange(user.id, '정상')}
                                    className={styles.c_1wsrq34}
                                  >
                                    <span className={styles.c_ivher9}></span>
                                    정상
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(user.id, '비회원')}
                                    className={styles.c_1wsrq34}
                                  >
                                    <span className={styles.c_1hog15u}></span>
                                    비회원
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(user.id, '탈퇴')}
                                    className={styles.c_1wsrq34}
                                  >
                                    <span className={styles.c_7wsy93}></span>
                                    탈퇴
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className={styles.c_13nmcpi}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}