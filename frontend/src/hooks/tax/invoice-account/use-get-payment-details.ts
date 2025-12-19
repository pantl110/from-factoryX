'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  PaymentDetailListResponseModel,
} from '@/types/data-model';

interface GetPaymentDetailsParams {
  page?: number;
  page_size?: number;
}

interface UseGetPaymentDetailsReturnModel {
  getPaymentDetails: (
    taxId: number,
    params?: GetPaymentDetailsParams
  ) => Promise<{
    success: boolean;
    data?: PaymentDetailListResponseModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

const useGetPaymentDetails = (): UseGetPaymentDetailsReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const getPaymentDetails = useCallback(
    async (taxId: number, params?: GetPaymentDetailsParams) => {
      setIsLoading(true);
      setError(null);

      const page = params?.page ?? 1;
      const pageSize = params?.page_size ?? 10;

      try {
        const data = await queryClient.fetchQuery<PaymentDetailListResponseModel>({
          queryKey: ['payment-details', taxId, page, pageSize],
          queryFn: async () => {
            const queryParams = new URLSearchParams({
              page: page.toString(),
              page_size: pageSize.toString(),
            });

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/v2/account-payment/${taxId}?${queryParams.toString()}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              }
            );

            if (!response.ok) {
              if (response.status === 404) {
                throw new Error(
                  '해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다.'
                );
              }
              if (response.status === 403) {
                throw new Error('접근 권한이 없습니다.');
              }
              if (response.status === 500) {
                throw new Error('서버 오류가 발생했습니다.');
              }
              const errorData = await response.json().catch(() => ({}));
              const errorMessage =
                (errorData as { detail?: string })?.detail ||
                '회수/지급 상세내역 조회에 실패했습니다.';
              throw new Error(errorMessage);
            }

            const data: PaymentDetailListResponseModel = await response.json();
            return data;
          },
        });

        return {
          success: true,
          data,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : '알 수 없는 오류가 발생했습니다.';
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
    getPaymentDetails,
    isLoading,
    error,
  };
};

export default useGetPaymentDetails;
