'use client';

import { useCallback, useState } from 'react';
import axios from 'axios';

interface SubscriptionPaymentInModel {
  factory_id?: number;
  subscription_id: number;
  billing_key: string;
  customer_key: string;
}

interface SubscriptionPaymentResultModel {
  subscription_id: number;
  subscription_type: string;
  payment_key: string;
  order_id: string;
  amount: number;
  status: string;
  approved_at: string | null;
  method: string | null;
  card_company: string | null;
  card_type?: string | null;
  card_number: string | null;
  card_owner_type?: string | null;
}

interface UseProcessSubscriptionPaymentReturnModel {
  processSubscriptionPayment: (
    payload: SubscriptionPaymentInModel
  ) => Promise<{
    success: boolean;
    data?: SubscriptionPaymentResultModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
  result: SubscriptionPaymentResultModel | null;
}

export const useProcessSubscriptionPayment = (): UseProcessSubscriptionPaymentReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubscriptionPaymentResultModel | null>(null);

  const processSubscriptionPayment = useCallback(
    async (payload: SubscriptionPaymentInModel) => {
      if (!payload.factory_id) {
        const msg = '공장 ID가 필요합니다.';
        setError(msg);
        return { success: false, error: msg };
      }

      if (!payload.subscription_id || !payload.billing_key || !payload.customer_key) {
        const msg = '필수 결제 정보가 누락되었습니다.';
        setError(msg);
        return { success: false, error: msg };
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post<SubscriptionPaymentResultModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/subscription/payment/${payload.factory_id}`,
          payload,
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const data = response.data;
        setResult(data);
        return { success: true, data };
      } catch (err) {
        let errorMessage = '구독 결제에 실패했습니다.';
        if (axios.isAxiosError(err)) {
          const data = err.response?.data as Record<string, unknown> | undefined;
          if (data) {
            const maybeDetail = typeof data.detail === 'string' ? data.detail : undefined;
            const maybeMessage = typeof data.message === 'string' ? data.message : undefined;
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
    },
    []
  );

  return { processSubscriptionPayment, isLoading, error, result };
};

export default useProcessSubscriptionPayment;


