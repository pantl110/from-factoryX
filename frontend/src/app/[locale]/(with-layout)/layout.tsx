'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Script from 'next/script';
import SideBar from '@/components/side-bar';
import TopBar from '@/components/top-bar';
import useAuthStore from '@/store/auth-store';
import { useAuthGuard } from '@/hooks';
import Spinner from '@/ui/spinner';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isLoading: isAuthLoading } = useAuthGuard();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

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
            isSidebarVisible ? 'ml-0 sm:ml-60' : 'ml-0'
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

      {/* Reflow 온보딩 가이드 위젯: 키가 설정된 환경에서만 로드 */}
      {process.env.NEXT_PUBLIC_REFLOW_KEY && (
        <Script
          src="https://cdn.reflowguide.com/v0.1.13/embed.js"
          integrity="sha384-eWhB3s8sXJFvbSM1PgJsbS8Cy84CzDOImAWiIsFZ/K4duoytPqczgCld8mTRqM5Z"
          crossOrigin="anonymous"
          data-key={process.env.NEXT_PUBLIC_REFLOW_KEY}
          strategy="afterInteractive"
        />
      )}
    </>
  );
};

export default Layout;
