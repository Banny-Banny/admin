import { Save, Bell, Lock, Globe, Palette } from 'lucide-react';
import styles from "./styles.module.css";

export function SettingsPage() {
  return (
    <div className={styles.c_1xnukmc}>
      <div>
        <h2 className={styles.c_1dlkxbt}>설정</h2>
        <p className={styles.c_9ngaqo}>시스템 설정을 관리하세요</p>
      </div>

      <div className={styles.c_4rnbt2}>
        <div className={styles.c_65x7hk}>
          <div className={styles.c_2ca09x}>
            <Bell className={styles.c_1cnlomk} size={20} />
            <h3 className={styles.c_1cmvr70}>알림 설정</h3>
          </div>
        </div>
        <div className={styles.c_tz90eq}>
          <div className={styles.c_xc8ak4}>
            <div>
              <p className={styles.c_55z0kz}>이메일 알림</p>
              <p className={styles.c_ibg1vp}>새로운 주문 및 활동에 대한 이메일을 받습니다</p>
            </div>
            <label className={styles.c_kkicf1}>
              <input type="checkbox" className={styles.c_1hpd10o} defaultChecked />
              <div className={styles.c_16279px}></div>
            </label>
          </div>
          <div className={styles.c_xc8ak4}>
            <div>
              <p className={styles.c_55z0kz}>푸시 알림</p>
              <p className={styles.c_ibg1vp}>브라우저 푸시 알림을 활성화합니다</p>
            </div>
            <label className={styles.c_kkicf1}>
              <input type="checkbox" className={styles.c_1hpd10o} />
              <div className={styles.c_16279px}></div>
            </label>
          </div>
        </div>
      </div>

      <div className={styles.c_4rnbt2}>
        <div className={styles.c_65x7hk}>
          <div className={styles.c_2ca09x}>
            <Lock className={styles.c_1cnlomk} size={20} />
            <h3 className={styles.c_1cmvr70}>보안</h3>
          </div>
        </div>
        <div className={styles.c_tz90eq}>
          <div>
            <label className={styles.c_eftqsg}>현재 비밀번호</label>
            <input
              type="password"
              className={styles.c_mbvevs}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className={styles.c_eftqsg}>새 비밀번호</label>
            <input
              type="password"
              className={styles.c_mbvevs}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className={styles.c_eftqsg}>비밀번호 확인</label>
            <input
              type="password"
              className={styles.c_mbvevs}
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      <div className={styles.c_4rnbt2}>
        <div className={styles.c_65x7hk}>
          <div className={styles.c_2ca09x}>
            <Globe className={styles.c_1cnlomk} size={20} />
            <h3 className={styles.c_1cmvr70}>지역 및 언어</h3>
          </div>
        </div>
        <div className={styles.c_tz90eq}>
          <div>
            <label className={styles.c_eftqsg}>언어</label>
            <select className={styles.c_mbvevs}>
              <option>한국어</option>
              <option>English</option>
              <option>日本語</option>
            </select>
          </div>
          <div>
            <label className={styles.c_eftqsg}>시간대</label>
            <select className={styles.c_mbvevs}>
              <option>서울 (GMT+9)</option>
              <option>뉴욕 (GMT-5)</option>
              <option>런던 (GMT+0)</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.c_4rnbt2}>
        <div className={styles.c_65x7hk}>
          <div className={styles.c_2ca09x}>
            <Palette className={styles.c_1cnlomk} size={20} />
            <h3 className={styles.c_1cmvr70}>외관</h3>
          </div>
        </div>
        <div className={styles.c_2c61}>
          <label className={styles.c_eftqsh}>테마</label>
          <div className={styles.c_1kh40jn}>
            <button className={styles.c_1bi9tfo}>
              <div className={styles.c_t50orh}></div>
              <p className={styles.c_17n5pcd}>라이트</p>
            </button>
            <button className={styles.c_mahtic}>
              <div className={styles.c_x57gpc}></div>
              <p className={styles.c_17n5pcd}>다크</p>
            </button>
            <button className={styles.c_mahtic}>
              <div className={styles.c_po4zvg}></div>
              <p className={styles.c_17n5pcd}>자동</p>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.c_1f6wbgz}>
        <button className={styles.c_8zbzmp}>
          취소
        </button>
        <button className={styles.c_mk9nis}>
          <Save size={20} />
          저장
        </button>
      </div>
    </div>
  );
}
