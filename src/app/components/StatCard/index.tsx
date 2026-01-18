import { LucideIcon } from 'lucide-react';
import styles from "./styles.module.css";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

export function StatCard({ title, value, change, changeType, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: styles.iconBlue,
    green: styles.iconGreen,
    purple: styles.iconPurple,
    orange: styles.iconOrange,
  };
  const changeClass =
    changeType === 'increase' ? styles.changeIncrease : styles.changeDecrease;

  return (
    <div className={styles.c_6422n}>
      <div className={styles.c_xc8ak4}>
        <div>
          <p className={styles.c_ibg2me}>{title}</p>
          <p className={styles.c_fsil5v}>{value}</p>
          <p className={`${styles.changeText} ${changeClass}`}>
            {change} 지난 달 대비
          </p>
        </div>
        <div className={`${styles.iconWrapper} ${colorClasses[color]}`}>
          <Icon className={styles.c_coba15} size={24} />
        </div>
      </div>
    </div>
  );
}
