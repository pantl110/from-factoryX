import { QuotationResponseModel } from '@/types/data-model';
import { useState, useEffect } from 'react';

interface UseGetDetailQuotationReturnModel {
  data: QuotationResponseModel | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// 견적서 ID로 견적서 상세 정보를 조회
const useGetDetailQuotation = (
  quotationId: number
): UseGetDetailQuotationReturnModel => {
  const [data, setData] = useState<QuotationResponseModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/${quotationId}`,
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
        setData(result);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '견적서 조회에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '견적서 조회에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationId]);

  const refetch = () => {
    fetchQuotation();
  };

  return { data, isLoading, error, refetch };
};

export default useGetDetailQuotation;
