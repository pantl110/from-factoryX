'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { PaymentAuthModel } from '@/types/data-model';

// 결제 인증 정보 (백엔드 PaymentAuthOut 스키마에 맞춰 정의)


interface UseGetPaymentAuthReturnModel {
  getPaymentAuth: (factoryId: number) => Promise<{
    success: boolean;
    data?: PaymentAuthModel;
    error?: string;
  }>;
  paymentAuth: PaymentAuthModel | null;
  isLoading: boolean;
  error: string | null;
}

// 공장의 가장 최근 결제 인증 정보 1건 조회
const useGetPaymentAuth = (): UseGetPaymentAuthReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentAuth, setPaymentAuth] = useState<PaymentAuthModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getPaymentAuth = useCallback(async (factoryId: number) => {
    if (!factoryId) {
      setError('공장 ID가 필요합니다.');
      return { success: false, error: '공장 ID가 필요합니다.' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get<PaymentAuthModel>(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/subscription/payment-auth/${factoryId}`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data;
      setPaymentAuth(result);
      return { success: true, data: result };
    } catch (err) {
      let errorMessage = '결제 인증 정보를 불러오지 못했습니다.';

      if (axios.isAxiosError(err)) {
        const data = err.response?.data as Record<string, unknown> | undefined;
        // 404인 경우에는 등록된 결제 정보가 없는 정상 상태이므로 기존 paymentAuth를 비워 UI를 최신화
        if (err.response?.status === 404) {
          setPaymentAuth(null);
        }
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
  }, []);

  return { getPaymentAuth, paymentAuth, isLoading, error };
};

export default useGetPaymentAuth;
