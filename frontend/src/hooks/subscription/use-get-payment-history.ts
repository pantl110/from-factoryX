import { useState, useCallback } from 'react';
import axios from 'axios';
import { PaymentListResponseModel } from '@/types/data-model';

// 공장의 결제 내역 조회
export const useGetPaymentHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] =
    useState<PaymentListResponseModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getPaymentHistory = useCallback(
    async (factoryId: number, page: number = 1, pageSize: number = 8) => {
      if (!factoryId) {
        setError('공장 ID가 필요합니다.');
        return { success: false, error: '공장 ID가 필요합니다.' };
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/subscription/payments/${factoryId}`,
          {
            params: {
              page,
              page_size: pageSize,
            },
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const result: PaymentListResponseModel = response.data;
        setPaymentHistory(result);
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
    },
    []
  );

  return { getPaymentHistory, paymentHistory, isLoading, error };
};

export default useGetPaymentHistory;
