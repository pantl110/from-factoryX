'use client';

import { useState, useCallback } from 'react';

// PaymentAuthOut 타입 정의 (백엔드 API 응답에 맞춰 추정)
export interface PaymentAuthModel {
  id: number;
  customer_key: string;
  billing_key: string;
  created_at: string;
  updated_at: string;
}

interface UseGetPaymentAuthReturnModel {
  getPaymentAuth: (factoryId: number) => Promise<{
    success: boolean;
    data?: PaymentAuthModel[];
    error?: string;
  }>;
  paymentAuths: PaymentAuthModel[] | null;
  isLoading: boolean;
  error: string | null;
}

// 공장의 결제 인증 정보 조회
const useGetPaymentAuth = (): UseGetPaymentAuthReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentAuths, setPaymentAuths] = useState<PaymentAuthModel[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const getPaymentAuth = useCallback(async (factoryId: number) => {
    if (!factoryId) {
      setError('공장 ID가 필요합니다.');
      return { success: false, error: '공장 ID가 필요합니다.' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/payment-auth/${factoryId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result: PaymentAuthModel[] = await response.json();
        setPaymentAuths(result);
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '결제 인증 정보를 불러오지 못했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      console.error('Payment auth fetch error:', err);
      const errorMessage = '서버 연결에 실패했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getPaymentAuth, paymentAuths, isLoading, error };
};

export default useGetPaymentAuth;
