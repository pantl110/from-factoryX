import { useState } from 'react';
import { LogoutResponseModel } from '@/types/data-model';
import useAuthStore from '@/store/auth-store';
import useFactoryStore from '@/store/factory-store';

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
  const { clearFactoryId } = useFactoryStore();

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

      if (response.ok) {
        const result = await response.json();

        // 로그아웃 성공 시 전역 상태 초기화
        clearAuth();
        clearFactoryId(); // factoryId도 클리어

        // localStorage에서 persist 데이터 직접 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('factory-storage');
        }

        // 쿠키 삭제
        document.cookie =
          'access=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie =
          'refresh=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        return {
          success: true,
          data: result,
        };
      } else {
        // 로그아웃 실패
        const errorData = await response.json();

        return {
          success: false,
          error:
            errorData.detail || '로그아웃에 실패했습니다. 다시 시도해주세요.',
        };
      }
    } catch {
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
