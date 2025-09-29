import { useState } from 'react';
import { LogoutResponseModel } from '@/types/data-model';
import useAuthStore from '@/store/auth-store';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { clearAuthData } from '@/utils/storage';

interface UseLogoutReturnModel {
  logout: () => Promise<{
    success: boolean;
    data?: LogoutResponseModel;
    error?: string;
  }>;
  isLoading: boolean;
}

export const useLogout = (): UseLogoutReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const { clearAuth } = useAuthStore();
  const { clearAll: clearMember } = useMemberStore();
  const { clearSubscription } = useSubscriptionStore();

  const logout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/logout`,
        {
          method: 'POST',
          credentials: 'include', // 쿠키 자동 전송
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      let result;
      if (response.ok) {
        result = await response.json();
      } else {
        // 로그아웃 실패
        result = await response.json();
      }

      // 1. 먼저 localStorage에서 저장소 제거
      clearAuthData();

      // 2. 그 다음 전역 상태 초기화
      clearAuth();
      clearMember(); // member store 전체 클리어
      clearSubscription(); // subscription store 전체 클리어

      if (response.ok) {
        return {
          success: true,
          data: result,
        };
      } else {
        return {
          success: false,
          error: result.detail || '로그아웃에 실패했습니다. 다시 시도해주세요.',
        };
      }
    } catch {
      // 에러가 발생해도 1. 먼저 localStorage에서 저장소 제거
      clearAuthData();

      // 2. 그 다음 전역 상태 초기화
      clearAuth();
      clearMember(); // member store 전체 클리어
      clearSubscription(); // subscription store 전체 클리어

      return {
        success: false,
        error: '서버 연결에 실패했습니다. 다시 시도해주세요.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logout,
    isLoading,
  };
};
