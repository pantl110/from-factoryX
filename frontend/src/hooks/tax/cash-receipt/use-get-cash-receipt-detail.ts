import { CashReceiptDetailResponseModel } from '@/types/data-model';
import { useState, useCallback } from 'react';

interface UseGetCashReceiptDetailReturnModel {
  getCashReceiptDetail: (cashReceiptId: number) => Promise<{
    success: boolean;
    data?: CashReceiptDetailResponseModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

const useGetCashReceiptDetail = (): UseGetCashReceiptDetailReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCashReceiptDetail = useCallback(async (cashReceiptId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/receipt/${cashReceiptId}`,
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
          throw new Error('해당 현금영수증이 존재하지 않습니다.');
        }
        if (response.status === 403) {
          throw new Error('접근 권한이 없습니다.');
        }
        throw new Error('현금영수증 조회에 실패했습니다.');
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
    getCashReceiptDetail,
    isLoading,
    error,
  };
};

export default useGetCashReceiptDetail;
