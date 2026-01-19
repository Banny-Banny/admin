'use client';
import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { UsersPage } from './components/UsersPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { SettingsPage } from './components/SettingsPage';
import { ProductsPage } from './components/ProductsPage';
import { ReportsPage } from './components/ReportsPage';
import { MarketingPage } from './components/MarketingPage';
import { LoginPage } from './components/LoginPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginPage
            onLogin={(email, password) => {
              console.log('Login attempt:', { email, password });
              // 로그인 성공 시 대시보드로 이동
              setCurrentPage('dashboard');
            }}
          />
        );
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <UsersPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'products':
        return <ProductsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'marketing':
        return <MarketingPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardOverview />;
    }
  };

  // 로그인 페이지일 때는 Sidebar와 Header를 숨김
  if (currentPage === 'login') {
    return (
      <div className="h-screen bg-gray-50">
        {renderPage()}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        isOpen={isSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}