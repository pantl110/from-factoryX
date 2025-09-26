'use client';

import { useCallback, useState } from 'react';
import axios from 'axios';
import useMemberStore from '@/store/member-store';

interface CancelScheduledSubscriptionResponseModel {
  message: string;
}

interface UseCancelScheduledSubscriptionReturnModel {
  cancelScheduledSubscription: () => Promise<{
    success: boolean;
    data?: CancelScheduledSubscriptionResponseModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
  result: CancelScheduledSubscriptionResponseModel | null;
}

export const useCancelScheduledSubscription =
  (): UseCancelScheduledSubscriptionReturnModel => {
    const { factoryId } = useMemberStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CancelScheduledSubscriptionResponseModel | null>(null);

    const cancelScheduledSubscription = useCallback(async () => {
      if (!factoryId) {
        const msg = '공장 ID가 필요합니다.';
        setError(msg);
        return { success: false, error: msg };
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.delete<CancelScheduledSubscriptionResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/subscription/scheduled-history/${factoryId}`,
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const { data } = response;
        setResult(data);
        return { success: true, data };
      } catch (err) {
        let errorMessage = '예정된 구독 취소에 실패했습니다.';
        if (axios.isAxiosError(err)) {
          const data = err.response?.data as unknown;
          if (data && typeof data === 'object') {
            const hasDetail = 'detail' in data;
            const hasMessage = 'message' in data;
            const maybeDetail =
              hasDetail &&
              typeof (data as { detail?: unknown }).detail === 'string'
                ? (data as { detail?: string }).detail
                : undefined;
            const maybeMessage =
              hasMessage &&
              typeof (data as { message?: unknown }).message === 'string'
                ? (data as { message?: string }).message
                : undefined;
            errorMessage = maybeDetail || maybeMessage || errorMessage;
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
    }, [factoryId]);

    return { cancelScheduledSubscription, isLoading, error, result };
  };

export default useCancelScheduledSubscription;
