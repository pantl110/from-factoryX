import { useState, useCallback } from 'react';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';

interface UseGetTaxInvoiceDetailReturnModel {
  getTaxInvoiceDetail: (taxId: number) => Promise<{
    success: boolean;
    data?: PublishedTaxInvoiceResponseModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

const useGetTaxInvoiceDetail = (): UseGetTaxInvoiceDetailReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTaxInvoiceDetail = useCallback(async (taxId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${taxId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('세금계산서를 찾을 수 없습니다.');
        }
        if (response.status === 403) {
          throw new Error('접근 권한이 없습니다.');
        }
        throw new Error('세금계산서 조회에 실패했습니다.');
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getTaxInvoiceDetail,
    isLoading,
    error,
  };
};

export default useGetTaxInvoiceDetail;
