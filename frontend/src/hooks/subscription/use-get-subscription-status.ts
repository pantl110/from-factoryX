import { useState, useCallback } from 'react';
import axios from 'axios';
import { SubscriptionStatusResponseModel } from '@/types/data-model';

// 공장의 구독 상태 조회
export const useGetSubscriptionStatus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatusResponseModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getSubscriptionStatus = useCallback(async (factoryId: number) => {
    if (!factoryId) {
      setError('공장 ID가 필요합니다.');
      return { success: false, error: '공장 ID가 필요합니다.' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/subscription/status/${factoryId}`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result: SubscriptionStatusResponseModel = response.data;
      setSubscriptionStatus(result);
      return { success: true, data: result };
    } catch (err) {
      let errorMessage = '서버 연결에 실패했습니다.';

      if (axios.isAxiosError(err)) {
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getSubscriptionStatus, subscriptionStatus, isLoading, error };
};

export default useGetSubscriptionStatus;
