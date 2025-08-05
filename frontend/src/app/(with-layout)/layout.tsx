'use client';

import { useState } from 'react';
import SideBar from '@/components/side-bar';
import TopBar from '@/components/top-bar';
import { usePathname } from 'next/navigation';
// import { useAuthGuard } from '@/hooks/use-auth-guard'

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const pathname = usePathname();

  // useAuthGuard() // 로그인 안되어있으면 로그인 페이지로 리다이렉트

  const isProductionPage = pathname.startsWith('/production/'); // production 페이지인지 확인

  // 사이드바 상태를 업데이트하는 함수
  const handleSidebarVisibilityChange = (visible: boolean) => {
    setIsSidebarVisible(visible);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SideBar onVisibilityChange={handleSidebarVisibilityChange} />
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isProductionPage && !isSidebarVisible ? 'ml-0' : 'ml-64'
        }`}
      >
        <div className="w-full relative">
          <TopBar isSidebarVisible={isSidebarVisible} />
        </div>
        <div className="flex flex-col flex-1 max-w-[1400px] min-w-[1000px] mx-auto w-full mt-[60px]">
          <main className="flex flex-col flex-1 min-h-0 h-full relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
