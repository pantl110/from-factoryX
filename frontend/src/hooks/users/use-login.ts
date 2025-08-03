import { useState } from 'react';
import { LoginFormDataModel, LoginResponseModel } from '@/types/data-model';
import useAuthStore from '@/store/auth-store';
import useFactoryStore from '@/store/factory-store';
import { useGetFactoryList } from '@/hooks/factory/use-get-factory';
// import useCreateFactory from '@/hooks/factory/use-create-factory';

interface UseLoginReturnModel {
  login: (data: LoginFormDataModel) => Promise<{
    success: boolean;
    data?: LoginResponseModel;
    error?: string;
    field?: 'email' | 'password';
  }>;
  isLoading: boolean;
}

export const useLogin = (): UseLoginReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const { setUserInfo, setAuthenticated } = useAuthStore();
  const setFactoryId = useFactoryStore((state) => state.setFactoryId);
  const { getFactoryList } = useGetFactoryList();
  // const { createFactory } = useCreateFactory();

  const login = async (data: LoginFormDataModel) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/login`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();

        // 로그인 성공 후 사용자 정보 자동 fetch
        try {
          const userResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/me`,
            {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (userResponse.ok) {
            const userData = await userResponse.json();
            // 전역 상태에 사용자 정보 저장
            setUserInfo(userData);
            setAuthenticated(true);

            // 성공 시
            // 공장 리스트 받아와서 factoryId 전역 저장
            try {
              const factoryResult = await getFactoryList();
              if (
                factoryResult.success &&
                factoryResult.data?.data &&
                factoryResult.data.data.length > 0
              ) {
                setFactoryId(factoryResult.data.data[0].id);
              } else {
                // 공장 목록이 비어있으면 임의로  공장을 하나 생성
                // try {
                //   const createFactoryResponse = await createFactory({
                //     name: '',
                //     business_registration_number: '',
                //     representative_name: '',
                //     manager_email: userData.email,
                //     manager_phone: '',
                //     manager_fax: '',
                //     business_type: '',
                //     business_category: '',
                //     business_address: '',
                //     is_trial: true,
                //     billing_key: '',
                //   });

                //   if (createFactoryResponse.success && createFactoryResponse.data) {
                //     setFactoryId(createFactoryResponse.data.id);
                //   } else {
                //     // setFactoryId(10);
                //   }
                //   } catch {
                //     // setFactoryId(10);
                //   }
                setFactoryId(2);
              }
            } catch {
              // 공장 리스트 fetch 실패 시 일단 임의로 기본값 설정
              setFactoryId(2);
            }
          }
        } catch {
          // 사용자 정보 fetch 실패 시 무시
          setFactoryId(2); // 일단 임의로 설정
        }

        return {
          success: true,
          data: result,
        };
      } else {
        // 로그인 실패
        const errorData = await response.json();

        // 에러 메시지에 따라 적절한 필드 반환
        if (errorData.detail) {
          // 비밀번호가 일치하지 않음
          if (errorData.detail.includes('비밀번호')) {
            return {
              success: false,
              error: errorData.detail,
              field: 'password' as const,
            };
          } else if (errorData.detail.includes('등록')) {
            // 등록되지 않은 이메일
            return {
              success: false,
              error: '입력하신 이메일로 가입된 계정이 존재하지 않습니다.',
              field: 'email' as const,
            };
          } else if (errorData.detail.includes('탈퇴')) {
            // 탈퇴한 계정
            return {
              success: false,
              error: errorData.detail,
              field: 'email' as const,
            };
          } else {
            return {
              success: false,
              error: errorData.detail,
              field: 'email' as const,
            };
          }
        } else {
          return {
            success: false,
            error: '로그인에 실패했습니다. 다시 시도해주세요.',
            field: 'email' as const,
          };
        }
      }
    } catch {
      return {
        success: false,
        error: '서버 연결에 실패했습니다. 다시 시도해주세요.',
        field: 'email' as const,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading,
  };
};
