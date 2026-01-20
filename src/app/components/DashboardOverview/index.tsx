import styles from "./styles.module.css";

export function DashboardOverview() {
  return (
    <div className={styles.c_1j8i8bf}>
      <div>
        <h2 className={styles.c_1dlkxbt}>대시보드</h2>
        <p className={styles.c_9ngaqo}>전체 통계 및 최근 활동을 확인하세요</p>
      </div>

      {/* 대시보드 내용은 추후 추가 예정 */}
      <div className={styles.c_dashboard_content}>
        <p>대시보드 내용이 여기에 표시됩니다.</p>
      </div>
    </div>
  );
}