'use client';

import { useState } from 'react';
import {
  LoginFormDataModel,
  LoginResponseModel,
  MemberRoleType,
  UserInfoModel,
} from '@/types/data-model';
import useAuthStore from '@/store/auth-store';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useGetMember, useGetFactoryList } from '@/hooks';

interface UseLoginReturnModel {
  login: (data: LoginFormDataModel) => Promise<{
    success: boolean;
    data?: LoginResponseModel;
    error?: string;
    field?: 'email' | 'password';
    factoryId?: number;
    role?: MemberRoleType;
    isBarobillUser?: boolean;
    userInfo?: UserInfoModel; // 사용자 정보 추가
  }>;
  isLoading: boolean;
}

export const useLogin = (): UseLoginReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const { setUserInfo, setAuthenticated } = useAuthStore();
  const { getFactoryList } = useGetFactoryList();
  const { getMember } = useGetMember();
  const { setFactoryId, setRole, setIsBarobillUser } = useMemberStore();
  const { setSubscription } = useSubscriptionStore();

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

        // 로그인 성공 후 사용자 정보 fetch
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

            // 전역 상태에 사용자 정보 저장 (persist가 자동으로 localStorage에 저장)
            setUserInfo(userData);
            setAuthenticated(true);

            try {
              // 먼저 사용자가 속한 공장 목록을 가져와서 factory ID 설정
              const factoryResult = await getFactoryList();

              if (
                factoryResult.success &&
                factoryResult.data &&
                factoryResult.data.length > 0
              ) {
                // 첫 번째 공장의 ID를 사용
                const factoryId = factoryResult.data[0].id;
                setFactoryId(factoryId);

                // 공장 ID가 있을 때만 member 정보 조회
                if (userData.member_id) {
                  const memberResult = await getMember({
                    factory_id: factoryId,
                    member_id: userData.member_id,
                  });

                  if (memberResult.success && memberResult.data) {
                    const member = memberResult.data;

                    // role과 isBarobillUser를 store에 저장
                    setRole(member.role);
                    setIsBarobillUser(member.is_barobill_user);

                    // 구독 정보 가져오기
                    try {
                      const subscriptionResponse = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/v1/subscription/status/${factoryId}`,
                        {
                          method: 'GET',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        }
                      );

                      if (subscriptionResponse.ok) {
                        const subscriptionData =
                          await subscriptionResponse.json();

                        if (subscriptionData.subscription_history) {
                          setSubscription({
                            id:
                              subscriptionData.subscription_history.id ?? null,
                            created_at:
                              subscriptionData.subscription_history
                                .created_at ?? null,
                            updated_at:
                              subscriptionData.subscription_history
                                .updated_at ?? null,
                            start_date:
                              subscriptionData.subscription_history
                                .start_date ?? null,
                            end_date:
                              subscriptionData.subscription_history.end_date ??
                              null,
                            is_canceled:
                              subscriptionData.subscription_history
                                .is_canceled ?? null,
                            type:
                              subscriptionData.subscription_history.subscription
                                ?.type ?? null,
                            is_active: subscriptionData.is_active ?? null,
                          });
                        }
                      }
                    } catch {
                      // 구독 정보 가져오기 실패 시 무시
                    }

                    return {
                      success: true,
                      factoryId,
                      role: member.role,
                      isBarobillUser: member.is_barobill_user,
                      userInfo: userData, // 사용자 정보 반환
                    };
                  }
                }

                // member 정보가 없어도 factoryId는 설정됨
                return {
                  success: true,
                  factoryId,
                  data: result,
                  userInfo: userData, // 사용자 정보 반환
                };
              } else {
                // 공장이 없는 경우
                return {
                  success: true,
                  data: result,
                  userInfo: userData, // 사용자 정보 반환
                };
              }
            } catch {
              // API 호출 실패 시
              return {
                success: true,
                data: result,
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
              error: '탈퇴한 계정입니다.',
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
