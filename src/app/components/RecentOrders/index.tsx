import styles from "./styles.module.css";
export function RecentOrders() {
  const orders = [
    { id: '#12345', customer: '김철수', product: '노트북', amount: '₩1,200,000', status: '배송중', date: '2026-01-17' },
    { id: '#12344', customer: '이영희', product: '스마트폰', amount: '₩850,000', status: '완료', date: '2026-01-16' },
    { id: '#12343', customer: '박민수', product: '태블릿', amount: '₩650,000', status: '처리중', date: '2026-01-16' },
    { id: '#12342', customer: '정수진', product: '이어폰', amount: '₩120,000', status: '완료', date: '2026-01-15' },
    { id: '#12341', customer: '최동욱', product: '키보드', amount: '₩89,000', status: '배송중', date: '2026-01-15' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료':
        return styles.statusDone;
      case '배송중':
        return styles.statusShipping;
      case '처리중':
        return styles.statusProcessing;
      default:
        return styles.statusDefault;
    }
  };

  return (
    <div className={styles.c_4rnbt2}>
      <div className={styles.c_65x7hk}>
        <h3 className={styles.c_1cmvr70}>최근 주문</h3>
      </div>
      <div className={styles.c_1bb8j67}>
        <table className={styles.c_1l2zdph}>
          <thead className={styles.c_z838al}>
            <tr>
              <th className={styles.c_wiarv4}>주문번호</th>
              <th className={styles.c_wiarv4}>고객</th>
              <th className={styles.c_wiarv4}>상품</th>
              <th className={styles.c_wiarv4}>금액</th>
              <th className={styles.c_wiarv4}>상태</th>
              <th className={styles.c_wiarv4}>날짜</th>
            </tr>
          </thead>
          <tbody className={styles.c_fyf4x}>
            {orders.map((order) => (
              <tr key={order.id} className={styles.c_x2lcqj}>
                <td className={styles.c_1a8xoxn}>{order.id}</td>
                <td className={styles.c_tp85ye}>{order.customer}</td>
                <td className={styles.c_tp85ye}>{order.product}</td>
                <td className={styles.c_cu5c8r}>{order.amount}</td>
                <td className={styles.c_g43mv3}>
                  <span className={`${styles.tagBase} ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className={styles.c_tp84h0}>{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
