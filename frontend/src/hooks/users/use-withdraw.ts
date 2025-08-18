import { useState } from 'react';

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
        `${process.env.NEXT_PUBLIC_API_URL}/v1/users/withdraw`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || '회원 탈퇴 중 오류가 발생했습니다.');
        return;
      }

      setIsSuccess(true);

      // 로컬 스토리지 정리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // 쿠키 정리 (필요한 경우)
      document.cookie =
        'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie =
        'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
