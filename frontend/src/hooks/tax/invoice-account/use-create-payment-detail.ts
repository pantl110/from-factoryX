'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  PaymentDetailResponseModel,
  PaymentDetailCreateModel,
} from '@/types/data-model';

interface UseCreatePaymentDetailReturnModel {
  createPaymentDetail: (
    taxId: number,
    payload: PaymentDetailCreateModel
  ) => Promise<{
    success: boolean;
    data?: PaymentDetailResponseModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

const useCreatePaymentDetail =
  (): UseCreatePaymentDetailReturnModel => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const createPaymentDetail = useCallback(
      async (taxId: number, payload: PaymentDetailCreateModel) => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v2/account-payment/${taxId}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(payload),
            }
          );

          if (!response.ok) {
            if (response.status === 404) {
              throw new Error(
                '해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다.'
              );
            }
            if (response.status === 400) {
              const errorData = await response.json().catch(() => ({}));
              const errorMessage =
                (errorData as { detail?: string })?.detail ||
                '입력한 정보가 올바르지 않습니다.';
              throw new Error(errorMessage);
            }
            if (response.status === 500) {
              throw new Error('서버 오류가 발생했습니다.');
            }
            const errorData = await response.json().catch(() => ({}));
            const errorMessage =
              (errorData as { detail?: string })?.detail ||
              '회수/지급 상세내역 생성에 실패했습니다.';
            throw new Error(errorMessage);
          }

          const data: PaymentDetailResponseModel = await response.json();

          // React Query 캐시 무효화 (목록 새로고침)
          queryClient.invalidateQueries({
            queryKey: ['payment-details', taxId],
          });
          // 채권/채무 정보도 업데이트되므로 무효화
          queryClient.invalidateQueries({
            queryKey: ['tax-invoice-account', taxId],
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
      createPaymentDetail,
      isLoading,
      error,
    };
  };

export default useCreatePaymentDetail;
