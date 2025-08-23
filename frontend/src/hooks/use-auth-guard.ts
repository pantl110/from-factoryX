import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/auth-store';
import useMemberStore from '@/store/member-store';

export const useAuthGuard = () => {
  const router = useRouter();
  const { userInfo, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { factoryId, role, isBarobillUser } = useMemberStore();

  // 전체 인증 상태를 확인하는 함수
  const isFullyAuthenticated = () => {
    return isAuthenticated && userInfo && factoryId !== null && role !== null && isBarobillUser !== null;
  };

  // 인증 체크가 완료되었는지 확인
  const isAuthCheckComplete = !authLoading && (isAuthenticated || !userInfo);

  useEffect(() => {
    // 로딩 중이면 아직 체크하지 않음
    if (authLoading) return;

    // 인증되지 않았거나 사용자 정보가 없으면 로그인 페이지로 이동
    if (!isAuthenticated || !userInfo) {
      router.push('/login');
      return;
    }

    // 공장 ID나 역할이 없으면 로그인 페이지로 이동
    if (factoryId === null || role === null || isBarobillUser === null) {
      router.push('/login');
      return;
    }
  }, [authLoading, isAuthenticated, userInfo, factoryId, role, isBarobillUser, router]);

  // 전체 로딩 상태 (인증 로딩 + 멤버 정보 로딩)
  const isLoading = authLoading || !isAuthCheckComplete;

  return {
    isFullyAuthenticated,
    isLoading,
    isAuthenticated,
    userInfo,
    factoryId,
    role,
    isBarobillUser,
  };
};
