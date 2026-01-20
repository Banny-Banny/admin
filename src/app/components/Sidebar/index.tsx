import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Package,
  ShoppingCart,
  FileText,
  Bell,
} from "lucide-react";
import styles from "./styles.module.css";

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isOpen: boolean;
}

export function Sidebar({
  currentPage,
  setCurrentPage,
  isOpen,
}: SidebarProps) {
  const menuItems = [
    {
      id: "dashboard",
      label: "대시보드",
      icon: LayoutDashboard,
    },
    { id: "inquiries", label: "문의하기", icon: ShoppingCart },
    { id: "users", label: "사용자 관리", icon: Users },
    { id: "analytics", label: "분석", icon: BarChart3 },
    { id: "products", label: "상품", icon: Package },
    { id: "reports", label: "공지사항", icon: FileText },
    { id: "marketing", label: "알림/마케팅", icon: Bell },
    { id: "settings", label: "설정", icon: Settings },
  ];

  return (
    <aside
      className={`${styles.sidebar} ${
        isOpen ? styles.sidebarOpen : styles.sidebarClosed
      }`}
    >
      <div className={styles.c_2c61}>
        <h1 className={styles.c_frz6p5}>Admin</h1>
      </div>
      <nav className={styles.c_200pc}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`${styles.menuButton} ${
                currentPage === item.id
                  ? styles.menuButtonActive
                  : styles.menuButtonInactive
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}