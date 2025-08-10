import { useState } from 'react';
import {
  LoginFormDataModel,
  LoginResponseModel,
  FactoriesResponseModel,
} from '@/types/data-model';
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
    factoryCount?: number;
    factories?: FactoriesResponseModel[];
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
            console.log('userData', userData);

            try {
              const factoryResult = await getFactoryList();
              if (factoryResult.success && factoryResult.data) {
                const factories = factoryResult.data; // 공장 리스트
                const factoryCount = factories.length; // 공장 개수
                console.log('factories', factories);

                if (factoryCount === 0) {
                  // 공장이 0개일 때 - 온보딩 페이지로 이동
                  return {
                    success: true,
                    factoryCount: 0,
                    factories: [],
                  };
                } else if (factoryCount === 1) {
                  // 공장이 1개일 때 - 첫 번째 공장 ID를 저장하고 대시보드로 이동
                  setFactoryId(factories[0].id); // 이 함수가 공장아이디를 로컬 스토리지에 저장함
                  return {
                    success: true,
                    factoryCount: 1,
                    factories,
                  };
                } else {
                  // 공장이 2개 이상일 때 (초대받은 공장이 있다는 뜻) - 공장 선택 모달을 보여줄 수 있도록 반환
                  return {
                    success: true,
                    factoryCount,
                    factories,
                  };
                }
              } else {
                // 공장 리스트 조회 실패 시 - 온보딩 페이지로 이동
                return {
                  success: true,
                  data: result,
                  factoryCount: 0,
                  factories: [],
                };
              }
            } catch {
              // 공장 리스트 조회 실패 시 - 온보딩 페이지로 이동
              return {
                success: true,
                data: result,
                factoryCount: 0,
                factories: [],
              };
            }
          } else {
            return {
              success: false,
              error: '사용자 정보를 가져오는데 실패했습니다.',
              field: 'email' as const,
            };
          }
        } catch {
          return {
            success: false,
            error: '사용자 정보를 가져오는데 실패했습니다.',
            field: 'email' as const,
          };
        }
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
