import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import useAuthStore from '@/store/auth-store';
import useMemberStore from '@/store/member-store';

/**
 * 인증 가드 훅
 * - 서버에서 실제 인증 상태 확인
 * - 인증 실패 시 로그인 페이지로 리다이렉트
 * - 필수 정보(공장 ID, 역할, 바로빌 사용자 여부) 검증
 */
export const useAuthGuard = () => {
  const router = useRouter();
  const {
    userInfo,
    isAuthenticated,
    isLoading: isAuthLoading,
    fetchUserInfo,
  } = useAuthStore();
  const { factoryId, role, isBarobillUser } = useMemberStore();
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  // 초기 마운트 시 서버에서 실제 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      setIsInitialCheck(true);
      await fetchUserInfo();
      setIsInitialCheck(false);
    };

    checkAuth();
  }, [fetchUserInfo]);

  // 전체 인증 상태 확인 함수
  const isFullyAuthenticated = () => {
    return (
      isAuthenticated &&
      userInfo !== null &&
      factoryId !== null &&
      role !== null &&
      isBarobillUser !== null
    );
  };

  // 인증 검증 및 리다이렉트
  useEffect(() => {
    // 초기 체크나 로딩 중이면 검증하지 않음
    if (isInitialCheck || isAuthLoading) return;

    // 인증 실패 또는 필수 정보 누락 시 로그인 페이지로 리다이렉트
    const isAuthFailed =
      !isAuthenticated ||
      !userInfo ||
      factoryId === null ||
      role === null ||
      isBarobillUser === null;

    if (isAuthFailed) {
      router.push('/login');
    }
  }, [
    isInitialCheck,
    isAuthLoading,
    isAuthenticated,
    userInfo,
    factoryId,
    role,
    isBarobillUser,
    router,
  ]);

  return {
    isFullyAuthenticated,
    isLoading: isInitialCheck || isAuthLoading,
    isAuthenticated,
    userInfo,
    factoryId,
    role,
    isBarobillUser,
  };
};
