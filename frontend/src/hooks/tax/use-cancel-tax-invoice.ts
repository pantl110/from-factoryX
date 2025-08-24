'use client';

import { useState, useCallback } from 'react';
import useMemberStore from '@/store/member-store';

interface CancelTaxInvoiceResponseModel {
  success: boolean;
  data?: {
    message: string;
  };
  error?: string;
}

// 세금계산서 발행 취소 훅
const useCancelTaxInvoice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useMemberStore();

  // 세금계산서 발행 취소
  const cancelTaxInvoice = useCallback(
    async (taxId: number): Promise<CancelTaxInvoiceResponseModel> => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          const errorMessage = '공장 ID가 설정되지 않았습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${taxId}/cancel`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail ||
            errorData.message ||
            '세금계산서 발행 취소에 실패했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch {
        const errorMessage = '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    cancelTaxInvoice,
    isLoading,
    error,
    clearError,
  };
};

export default useCancelTaxInvoice;
