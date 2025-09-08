'use client';

import { useState, useCallback } from 'react';
import { PaymentListResponseModel } from '@/types/data-model';

// 공장의 결제 내역 조회
const useGetPaymentHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] =
    useState<PaymentListResponseModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getPaymentHistory = useCallback(
    async (factoryId: number, page: number = 1, pageSize: number = 10) => {
      if (!factoryId) {
        setError('공장 ID가 필요합니다.');
        return { success: false, error: '공장 ID가 필요합니다.' };
      }

      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('page_size', pageSize.toString());

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/payments/${factoryId}?${queryParams}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const result: PaymentListResponseModel = await response.json();
          setPaymentHistory(result);
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail || '결제 내역을 불러오지 못했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch (err) {
        console.error('Payment history fetch error:', err);
        const errorMessage = '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { getPaymentHistory, paymentHistory, isLoading, error };
};

export default useGetPaymentHistory;
