'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface UseDeletePaymentDetailReturnModel {
  deletePaymentDetail: (paymentId: number) => Promise<{
    success: boolean;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

const useDeletePaymentDetail = (): UseDeletePaymentDetailReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const deletePaymentDetail = useCallback(
    async (paymentId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/account-payment/payment/${paymentId}`,
          {
            withCredentials: true,
          }
        );

        // React Query 캐시 무효화 (모든 payment-details 쿼리 무효화)
        // taxId와 type을 정확히 알 수 없으므로 넓게 무효화
        queryClient.invalidateQueries({
          queryKey: ['payment-details'],
        });
        // 채권/채무 정보도 업데이트되므로 무효화
        queryClient.invalidateQueries({
          queryKey: ['tax-invoice-account'],
        });

        return {
          success: true,
        };
      } catch (err) {
        let errorMessage = '알 수 없는 오류가 발생했습니다.';

        if (axios.isAxiosError(err)) {
          if (err.response) {
            const { status } = err.response;
            const errorData = err.response.data as { detail?: string };

            if (status === 404) {
              errorMessage =
                errorData?.detail ||
                '해당 회수/지급 상세내역을 찾을 수 없습니다.';
            } else if (status === 500) {
              errorMessage = '서버 오류가 발생했습니다.';
            } else {
              errorMessage =
                errorData?.detail || '회수/지급 상세내역 삭제에 실패했습니다.';
            }
          } else if (err.request) {
            errorMessage = '네트워크 오류가 발생했습니다.';
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient]
  );

  return {
    deletePaymentDetail,
    isLoading,
    error,
  };
};

export default useDeletePaymentDetail;
