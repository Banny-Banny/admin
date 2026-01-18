import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import styles from "./styles.module.css";

export function AnalyticsPage() {
  const monthlyData = [
    { month: '1월', 방문자: 4200, 전환: 320, 매출: 4500 },
    { month: '2월', 방문자: 3800, 전환: 280, 매출: 3800 },
    { month: '3월', 방문자: 5100, 전환: 420, 매출: 5200 },
    { month: '4월', 방문자: 4800, 전환: 380, 매출: 4900 },
    { month: '5월', 방문자: 6200, 전환: 510, 매출: 6100 },
    { month: '6월', 방문자: 5900, 전환: 470, 매출: 5800 },
  ];

  const categoryData = [
    { name: '전자기기', value: 35 },
    { name: '패션', value: 25 },
    { name: '식품', value: 20 },
    { name: '도서', value: 12 },
    { name: '기타', value: 8 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
  const getRateClass = (rate: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(rate)));
    return styles[`barWidth${clamped}` as keyof typeof styles];
  };

  return (
    <div className={styles.c_1j8i8bf}>
      <div>
        <h2 className={styles.c_1dlkxbt}>분석</h2>
        <p className={styles.c_9ngaqo}>상세한 통계와 인사이트를 확인하세요</p>
      </div>

      <div className={styles.c_ittbg8}>
        <div className={styles.c_6422n}>
          <div className={styles.c_xc8ak4}>
            <div>
              <p className={styles.c_ibg2me}>평균 방문 시간</p>
              <p className={styles.c_fsil5v}>4분 32초</p>
              <div className={styles.c_1ptnat9}>
                <TrendingUp size={16} />
                <span>+12.5%</span>
              </div>
            </div>
            <div className={styles.c_nao3w3}>
              <Activity className={styles.c_coba15} size={24} />
            </div>
          </div>
        </div>

        <div className={styles.c_6422n}>
          <div className={styles.c_xc8ak4}>
            <div>
              <p className={styles.c_ibg2me}>이탈률</p>
              <p className={styles.c_fsil5v}>32.4%</p>
              <div className={styles.c_1ptnat9}>
                <TrendingDown size={16} />
                <span>-5.2%</span>
              </div>
            </div>
            <div className={styles.c_97666m}>
              <Activity className={styles.c_coba15} size={24} />
            </div>
          </div>
        </div>

        <div className={styles.c_6422n}>
          <div className={styles.c_xc8ak4}>
            <div>
              <p className={styles.c_ibg2me}>페이지뷰</p>
              <p className={styles.c_fsil5v}>125,432</p>
              <div className={styles.c_1ptnat9}>
                <TrendingUp size={16} />
                <span>+18.3%</span>
              </div>
            </div>
            <div className={styles.c_14ps4wl}>
              <Activity className={styles.c_coba15} size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.c_141lpzv}>
        <div className={styles.c_6422n}>
          <h3 className={styles.c_1l693jk}>월별 성과</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="방문자" fill="#3b82f6" />
              <Bar dataKey="전환" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.c_6422n}>
          <h3 className={styles.c_1l693jk}>카테고리별 매출 비중</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent ?? 0 * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.c_6422n}>
        <h3 className={styles.c_1l693jk}>상위 페이지</h3>
        <div className={styles.c_1j8i8bd}>
          {[
            { page: '/products/smartphone', views: 12543, rate: 45 },
            { page: '/products/laptop', views: 9821, rate: 38 },
            { page: '/category/fashion', views: 8234, rate: 32 },
            { page: '/products/tablet', views: 6543, rate: 28 },
            { page: '/deals', views: 5432, rate: 25 },
          ].map((item, index) => (
            <div key={index} className={styles.c_2ca09y}>
              <div className={styles.c_1dzu82l}>
                <p className={styles.c_17n5pcd}>{item.page}</p>
                <div className={styles.c_5o9x82}>
                  <div
                    className={`${styles.c_1qdtcev} ${getRateClass(item.rate)}`}
                  ></div>
                </div>
              </div>
              <div className={styles.c_clkwak}>
                <p className={styles.c_17n5pcd}>{item.views.toLocaleString()}</p>
                <p className={styles.c_1invsyu}>조회수</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
