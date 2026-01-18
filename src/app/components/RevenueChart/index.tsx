import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from "./styles.module.css";

export function RevenueChart() {
  const data = [
    { month: '1월', revenue: 4000, orders: 240 },
    { month: '2월', revenue: 3000, orders: 198 },
    { month: '3월', revenue: 5000, orders: 350 },
    { month: '4월', revenue: 4500, orders: 295 },
    { month: '5월', revenue: 6000, orders: 410 },
    { month: '6월', revenue: 5500, orders: 380 },
    { month: '7월', revenue: 7000, orders: 470 },
  ];

  return (
    <div className={styles.c_6422n}>
      <h3 className={styles.c_1l693jk}>매출 추이</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="매출 (만원)" />
          <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="주문 수" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
