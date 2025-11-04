import { useState } from 'react';
import { FactoriesModel } from '@/types/data-model';
import { useGetSubscriptionStatus } from '@/hooks';
import useSubscriptionStore from '@/store/subscription-store';

interface CreateFactoryResponseModel {
  factory_id: number;
}

const useCreateFactory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getSubscriptionStatus } = useGetSubscriptionStatus();
  const { setSubscription } = useSubscriptionStore();

  const createFactory = async (data: FactoriesModel) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
      if (response.status === 201) {
        const result: CreateFactoryResponseModel = await response.json();
        const newFactoryId = result.factory_id;

        // 공장 생성 직후 구독 상태를 조회하여 스토어 갱신
        try {
          const res = await getSubscriptionStatus(newFactoryId);
          const { success: isSuccess, data } = res;
          if (isSuccess && data && data.subscription_history) {
            setSubscription({
              id: data.subscription_history.id ?? null,
              created_at: data.subscription_history.created_at ?? null,
              updated_at: data.subscription_history.updated_at ?? null,
              start_date: data.subscription_history.start_date ?? null,
              end_date: data.subscription_history.end_date ?? null,
              is_canceled: data.subscription_history.is_canceled ?? null,
              type: data.subscription_history.subscription?.type ?? null,
              is_active: data.is_active ?? null,
            });
          }
        } catch {
          // 구독 조회 실패는 공장 생성 성공과는 별개로 무시
        }

        return { success: true, data: { id: newFactoryId } };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '공장 등록에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { createFactory, isLoading, error };
};

export default useCreateFactory;
