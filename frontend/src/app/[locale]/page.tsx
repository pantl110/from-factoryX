'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import useAuthStore from '@/store/auth-store';
import { clearAuthData } from '@/utils/storage';

/**
 * 루트 페이지
 * - 자동 로그인 비활성화: 항상 로그인 페이지로 리다이렉트
 * - 페이지 로드 시 모든 인증 데이터 삭제 (localStorage, store)
 * - 브라우저 닫을 때 localStorage/store 클리어
 *
 * 참고: 쿠키는 백엔드에서 세션 쿠키로 설정되어 있어 브라우저 종료 시 자동 삭제됩니다.
 */
const Home = () => {
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  /**
   * 인증 토큰 및 데이터 삭제
   * - localStorage 인증 데이터 삭제
   * - Zustand store 인증 상태 초기화
   *
   * 참고: 쿠키는 백엔드에서 세션 쿠키(expires=None)로 설정되어 있어
   * 브라우저를 닫을 때 자동으로 삭제됩니다.
   */
  const clearTokens = useCallback(() => {
    // localStorage 및 store 초기화
    clearAuthData();
    clearAuth();
  }, [clearAuth]);

  // 페이지 로드 시 토큰 삭제 후 로그인 페이지로 리다이렉트
  useEffect(() => {
    clearTokens();
    router.push('/login');
  }, [clearTokens, router]);

  // 브라우저 닫을 때 localStorage/store 클리어
  useEffect(() => {
    // pagehide: 브라우저 종료 시에만 실행 (탭 전환, 일반적인 페이지 이동에는 실행 안 됨)
    const handlePageHide = (e: PageTransitionEvent) => {
      // persisted가 false면 브라우저 종료, true면 뒤로 가기 캐시에 저장됨
      if (!e.persisted) {
        clearTokens(); // localStorage와 store만 클리어 (쿠키는 브라우저가 자동 삭제)
      }
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [clearTokens]);

  return null;
};

export default Home;
