'use client';

import { useState } from 'react';
import SideBar from '@/components/side-bar';
import TopBar from '@/components/top-bar';
import { usePathname } from 'next/navigation';
// import { useAuthGuard } from '@/hooks';

const Layout = ({ children }: { children: React.ReactNode }) => {
  // 인증 가드 적용 - 모든 하위 페이지에 자동으로 적용됨
  // const { isLoading: isAuthLoading } = useAuthGuard();

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const pathname = usePathname();

  const isProductionPage = pathname.startsWith('/production/'); // production 페이지인지 확인

  // 사이드바 상태를 업데이트하는 함수
  const handleSidebarVisibilityChange = (visible: boolean) => {
    setIsSidebarVisible(visible);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 데스크톱에서만 사이드바 표시 */}
      <div className="hidden sm:block">
        <SideBar onVisibilityChange={handleSidebarVisibilityChange} />
      </div>

      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isProductionPage && !isSidebarVisible ? 'ml-0' : 'ml-0 sm:ml-64'
        }`}
      >
        {/* 데스크톱에서만 탑바 표시 */}
        <div className="w-full relative hidden sm:block">
          <TopBar isSidebarVisible={isSidebarVisible} />
        </div>

        <div className="flex flex-col flex-1 w-full sm:max-w-[1400px] sm:min-w-[1000px] mx-auto mt-0 sm:mt-[60px]">
          <main className="flex flex-col flex-1 min-h-0 relative">
            {children}
            {/* <div className="flex justify-center items-center h-[800px]">
              <Spinner />
            </div> */}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
