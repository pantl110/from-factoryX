'use client';

import { useCallback, useState } from 'react';
import axios from 'axios';

interface PaymentCancelInModel {
  cancel_reason: string;
  cancel_amount?: number | null;
}

interface PaymentCancelOutModel {
  payment_key: string;
  cancel_amount: number;
  cancel_reason: string;
  canceled_at: string; // ISO string
}

interface UseCancelSubscriptionPaymentReturnModel {
  cancelSubscriptionPayment: (
    paymentId: number,
    payload: PaymentCancelInModel
  ) => Promise<{
    success: boolean;
    data?: PaymentCancelOutModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
  result: PaymentCancelOutModel | null;
}

export const useCancelSubscriptionPayment = (): UseCancelSubscriptionPaymentReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentCancelOutModel | null>(null);

  const cancelSubscriptionPayment = useCallback(
    async (paymentId: number, payload: PaymentCancelInModel) => {
      if (!paymentId) {
        const msg = '결제 ID가 필요합니다.';
        setError(msg);
        return { success: false, error: msg };
      }

      if (!payload?.cancel_reason) {
        const msg = '취소 사유가 필요합니다.';
        setError(msg);
        return { success: false, error: msg };
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post<PaymentCancelOutModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/subscription/cancel/${paymentId}`,
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
        let errorMessage = '구독 결제 취소에 실패했습니다.';
        if (axios.isAxiosError(err)) {
          const data = err.response?.data as Record<string, unknown> | undefined;
          if (data) {
            const maybeDetail = typeof (data as any).detail === 'string' ? (data as any).detail : undefined;
            const maybeMessage = typeof (data as any).message === 'string' ? (data as any).message : undefined;
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

  return { cancelSubscriptionPayment, isLoading, error, result };
};

export default useCancelSubscriptionPayment;


