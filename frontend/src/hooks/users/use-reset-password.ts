import { useState } from 'react';
import { ResetPasswordModel } from '@/types/data-model';
import { useRouter } from 'next/navigation';

export interface UseResetPasswordReturnModel {
  resetPassword: (data: ResetPasswordModel) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  reset: () => void;
}

export const useResetPassword = (): UseResetPasswordReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();

  const resetPassword = async (data: ResetPasswordModel): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            code: data.code,
            new_password: data.new_password,
            new_password_confirm: data.new_password_confirm,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || '비밀번호 설정 중 오류가 발생했습니다.');
        return;
      }

      setIsSuccess(true);
      router.push('/login'); // 비밀번호 설정 성공 후 // 로그인 페이지로 리다이렉트
    } catch {
      setError('비밀번호 설정 중 오류가 발생했습니다.');
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
    resetPassword,
    isLoading,
    error,
    isSuccess,
    reset,
  };
};
