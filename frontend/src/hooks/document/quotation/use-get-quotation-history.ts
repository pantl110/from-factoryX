import { QuotationProductHistoryItemResponseModel } from '@/types/data-model';
import { useState, useCallback } from 'react';

interface QuotationHistoryResponseModel {
  results: QuotationProductHistoryItemResponseModel[];
}

interface UseGetQuotationHistoryReturnModel {
  getHistory: (productIds: number[]) => Promise<QuotationHistoryResponseModel>;
  isLoading: boolean;
  error: string | null;
}

// 견적서 품목 히스토리 조회 // 이전에 생산하였던 Quotation Product 항목을 조회
const useGetQuotationHistory = (): UseGetQuotationHistoryReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHistory = useCallback(
    async (productIds: number[]): Promise<QuotationHistoryResponseModel> => {
      setIsLoading(true);
      setError(null);

      try {
        const productIdsString = productIds.join(',');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/product/history/list?product_ids=${productIdsString}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          return result;
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.message ||
            errorData.detail ||
            '견적서 히스토리 조회에 실패했습니다.';

          // 404 오류는 빈 배열로 처리 (데이터가 없는 경우)
          if (response.status === 404) {
            return { results: [] };
          }

          throw new Error(errorMessage);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : '견적서 히스토리 조회에 실패했습니다.';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { getHistory, isLoading, error };
};

export default useGetQuotationHistory;
