import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Package,
  ShoppingCart,
  FileText,
  CreditCard,
} from "lucide-react";
import { MessageIcon } from "../../commons/components/icons/MessageIcon";
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
    { id: "orders", label: "주문 관리", icon: ShoppingCart },
    { id: "payments", label: "결제 관리", icon: CreditCard },
    { id: "inquiries", label: "문의하기", icon: FileText },
    { id: "users", label: "사용자 관리", icon: Users },
    { id: "analytics", label: "분석", icon: BarChart3 },
    { id: "products", label: "상품", icon: Package },
    { id: "reports", label: "운영 공지", icon: FileText },
    { id: "marketing", label: "유저 알림 발송", icon: MessageIcon },
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