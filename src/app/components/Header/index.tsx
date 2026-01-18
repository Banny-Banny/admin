import { Menu, Search, Bell, User } from 'lucide-react';
import styles from "./styles.module.css";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  return (
    <header className={styles.c_dd0ei0}>
      <div className={styles.c_xc8ak4}>
        <div className={styles.c_2ca09y}>
          <button
            onClick={toggleSidebar}
            className={styles.c_1us4dfh}
          >
            <Menu size={20} />
          </button>
          <div className={styles.c_1pv0ki4}>
            <Search className={styles.c_1y94mk} size={20} />
            <input
              type="text"
              placeholder="검색..."
              className={styles.c_1alpe0z}
            />
          </div>
        </div>
        <div className={styles.c_2ca09y}>
          <button className={styles.c_pf1hox}>
            <Bell size={20} />
            <span className={styles.c_th8xx3}></span>
          </button>
          <div className={styles.c_2ca09x}>
            <div className={styles.c_ex8703}>
              <User size={20} className={styles.c_coba15} />
            </div>
            <div>
              <p className={styles.c_17n5pcd}>관리자</p>
              <p className={styles.c_1invsyu}>admin@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
