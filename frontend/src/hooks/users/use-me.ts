import { UserInfoModel, UpdateUserInfoModel } from '@/types/data-model';
import { useState, useCallback } from 'react';

interface UseMeReturnModel {
  updateMe: (updateData: UpdateUserInfoModel) => Promise<{
    success: boolean;
    data?: UserInfoModel;
    error?: string;
  }>;
  isLoading: boolean;
}

export const useMe = (): UseMeReturnModel => {
  const [isLoading, setIsLoading] = useState(false);

  // 내 정보 수정
  const updateMe = useCallback(async (updateData: UpdateUserInfoModel) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/me`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const userData: UserInfoModel = await response.json();
        return {
          success: true,
          data: userData,
        };
      } else {
        return {
          success: false,
          error: '프로필 정보 수정에 실패했습니다.',
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
  }, []);

  return {
    updateMe,
    isLoading,
  };
};
