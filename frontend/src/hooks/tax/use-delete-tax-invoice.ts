'use client';

import { useState, useCallback } from 'react';
import useMemberStore from '@/store/member-store';

interface DeleteTaxInvoiceResponseModel {
  success: boolean;
  error?: string;
}

// 세금계산서 삭제 훅
const useDeleteTaxInvoice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useMemberStore();

  // 세금계산서 삭제
  const deleteTaxInvoice = useCallback(
    async (taxId: number): Promise<DeleteTaxInvoiceResponseModel> => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          const errorMessage = '공장 ID가 설정되지 않았습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${taxId}`,
          {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 204) {
          return { success: true };
        } else if (response.status === 404) {
          const errorMessage = '세금계산서를 찾을 수 없습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail ||
            errorData.message ||
            '세금계산서 삭제에 실패했습니다.';
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
    deleteTaxInvoice,
    isLoading,
    error,
    clearError,
  };
};

export default useDeleteTaxInvoice;
