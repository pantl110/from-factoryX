import { useState } from 'react';
import { SignupFormDataModel } from '@/types/data-model';
import { useRouter } from 'next/navigation';
// import { useCreateFactory } from '@/hooks';

export interface UseSignupReturnModel {
  signup: (data: SignupFormDataModel) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  reset: () => void;
}

export const useSignup = (): UseSignupReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();
  // const { createFactory } = useCreateFactory();

  const signup = async (data: SignupFormDataModel): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            password_confirm: data.password_confirm,
            terms_of_service: true, // 무조건 동의
            privacy_policy_agreement: true, // 무조건 동의
            marketing_agreement: false, // 현재 없음
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || '회원가입 중 오류가 발생했습니다.');
        return;
      }

      setIsSuccess(true);
      // await createFactory({ name: '' }); // 회원가입 성공 시 공장 생성 // 권환이 시스템관리자 일때만..!
      router.push('/login'); // 로그인 페이지로 리다이렉트
    } catch {
      setError('회원가입 중 오류가 발생했습니다.');
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
    signup,
    isLoading,
    error,
    isSuccess,
    reset,
  };
};
