import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/auth-store';

// 로그인되어있는지 확인 후 로그인 안되어있으면 로그인 페이지로 리다이렉트
export const useAuthGuard = () => {
  const router = useRouter();
  const { userInfo, isAuthenticated, fetchUserInfo } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      // 이미 인증된 사용자 정보가 있으면 스킵
      if (userInfo && isAuthenticated) {
        return;
      }

      // persist된 상태가 없거나 만료된 경우에만 API 호출
      try {
        const isSuccess = await fetchUserInfo();
        if (!isSuccess) {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    };

    checkAuth();
  }, [userInfo, isAuthenticated, fetchUserInfo, router]);
};
