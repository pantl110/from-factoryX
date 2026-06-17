'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from '@/i18n/navigation';
import SideBar from '@/components/side-bar';
import TopBar from '@/components/top-bar';
import useAuthStore from '@/store/auth-store';
import { useAuthGuard } from '@/hooks';
import Spinner from '@/ui/spinner';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { isLoading: isAuthLoading } = useAuthGuard();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

  // Production 페이지 여부 확인 (locale 포함 경로 고려)
  const isProductionPage = pathname.includes('/production/');

  // 인증 확인 중이면 로딩 스피너 표시
  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      {/* 로그아웃 중일 때 전체 화면 덮기 */}
      {isLoggingOut &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-white z-[9999]" />,
          document.body
        )}

      <div className="flex flex-col min-h-screen">
        {/* 데스크톱 사이드바 */}
        <div className="hidden sm:block">
          <SideBar
            onVisibilityChange={(visible) => setIsSidebarVisible(visible)}
          />
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div
          className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
            isProductionPage && !isSidebarVisible ? 'ml-0' : 'ml-0 sm:ml-52'
          }`}
        >
          {/* 데스크톱 탑바 */}
          <div className="w-full relative hidden sm:block">
            <TopBar isSidebarVisible={isSidebarVisible} />
          </div>

          {/* 페이지 콘텐츠 */}
          <div className="flex flex-col flex-1 w-full sm:max-w-[1400px] sm:min-w-[1000px] mx-auto mt-0 sm:mt-[60px]">
            <main className="flex flex-col flex-1 min-h-0 relative">
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
