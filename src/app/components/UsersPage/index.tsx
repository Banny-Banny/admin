import { Search, Filter, MoreVertical, Mail, X, UserPlus, Shield } from 'lucide-react';
import { useState } from 'react';
import styles from "./styles.module.css";

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);

  const [admins, setAdmins] = useState([
    {
      id: 1,
      name: '관리자',
      nickname: 'admin',
      email: 'admin@example.com',
      role: '최고관리자',
      joinDate: '2025-01-01',
      lastLogin: '2026-01-18 09:00',
    },
  ]);

  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    role: '일반관리자',
    password: '',
  });

  const [users, setUsers] = useState([
    { 
      id: 1, 
      name: '김철수', 
      nickname: '철수왕',
      email: 'kim@example.com', 
      platform: '카카오', 
      status: '정상', 
      joinDate: '2025-03-15',
      lastLogin: '2026-01-17 14:23'
    },
    { 
      id: 2, 
      name: '이영희', 
      nickname: '영희짱',
      email: 'lee@example.com', 
      platform: '네이버', 
      status: '정상', 
      joinDate: '2025-05-20',
      lastLogin: '2026-01-17 10:15'
    },
    { 
      id: 3, 
      name: '박민수', 
      nickname: '민수123',
      email: 'park@example.com', 
      platform: '구글', 
      status: '정상', 
      joinDate: '2025-07-10',
      lastLogin: '2026-01-16 18:30'
    },
    { 
      id: 4, 
      name: '정수진', 
      nickname: '수진이',
      email: 'jung@example.com', 
      platform: '일반', 
      status: '탈퇴', 
      joinDate: '2025-09-05',
      lastLogin: '2025-12-20 09:45'
    },
    { 
      id: 5, 
      name: '최동욱', 
      nickname: '동욱오빠',
      email: 'choi@example.com', 
      platform: '카카오', 
      status: '정상', 
      joinDate: '2025-11-22',
      lastLogin: '2026-01-17 08:12'
    },
    { 
      id: 6, 
      name: '강지혜', 
      nickname: '지혜로운',
      email: 'kang@example.com', 
      platform: '네이버', 
      status: '비회원', 
      joinDate: '2026-01-08',
      lastLogin: '2026-01-10 15:20'
    },
    { 
      id: 7, 
      name: '윤서준', 
      nickname: '서준킹',
      email: 'yoon@example.com', 
      platform: '구글', 
      status: '정상', 
      joinDate: '2025-04-12',
      lastLogin: '2026-01-17 11:30'
    },
    { 
      id: 8, 
      name: '임하은', 
      nickname: '하은공주',
      email: 'lim@example.com', 
      platform: '일반', 
      status: '정상', 
      joinDate: '2025-08-25',
      lastLogin: '2026-01-16 20:45'
    },
  ]);

  const handleStatusChange = (userId: number, newStatus: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
    setOpenDropdown(null);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAdmin = {
      id: admins.length + 1,
      name: adminFormData.name,
      nickname: adminFormData.email.split('@')[0],
      email: adminFormData.email,
      role: adminFormData.role,
      joinDate: new Date().toISOString().split('T')[0],
      lastLogin: '-',
    };

    setAdmins([...admins, newAdmin]);
    setAdminFormData({
      name: '',
      email: '',
      role: '일반관리자',
      password: '',
    });
    setShowAdminForm(false);
    alert('관리자가 추가되었습니다!');
  };

  const handleDeleteAdmin = (adminId: number) => {
    if (confirm('정말 이 관리자를 삭제하시겠습니까?')) {
      setAdmins(admins.filter(admin => admin.id !== adminId));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || user.platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
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

  const getStatusColor = (status: string) => {
    switch (status) {
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
          <p className={styles.c_9ngaqo}>전체 {users.length}명의 사용자</p>
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={styles.c_x2lcqj}>
                    <td className={styles.c_g43mv3}>
                      <div className={styles.c_2ca09x}>
                        <div className={styles.c_1oa1gq1}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className={styles.c_1my21gc}>{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className={styles.c_g43mv3}>
                      <p className={styles.c_ibg3d3}>{user.nickname}</p>
                    </td>
                    <td className={styles.c_g43mv3}>
                      <p className={styles.c_r4fgsq}>
                        <Mail size={14} />
                        {user.email}
                      </p>
                    </td>
                    <td className={styles.c_g43mv3}>
                      <span className={styles.c_a0rzae}>
                        <span>{getPlatformIcon(user.platform)}</span>
                        {user.platform}
                      </span>
                    </td>
                    <td className={styles.c_g43mv3}>
                      <span className={`${styles.tagBase} ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className={styles.c_tp84h0}>{user.joinDate}</td>
                    <td className={styles.c_tp84h0}>{user.lastLogin}</td>
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
                ))
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