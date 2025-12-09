'use client';

import { useState } from 'react';
import { clearAllStorage } from '@/utils/storage';

export interface UseWithdrawReturnModel {
  withdraw: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  reset: () => void;
}

export const useWithdraw = (): UseWithdrawReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const withdraw = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/withdraw`,
        {
          credentials: 'include',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || '회원 탈퇴 중 오류가 발생했습니다.');
        return;
      }

      setIsSuccess(true);

      // 모든 스토리지와 쿠키 정리
      clearAllStorage();
    } catch {
      setError('회원 탈퇴 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setIsSuccess(false);
  };

  return {
    withdraw,
    isLoading,
    error,
    isSuccess,
    reset,
  };
};
