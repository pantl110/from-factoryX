import { useState, useEffect } from 'react';
import { QuotationResponseModel } from '@/types/data-model';

interface UseGetQuotationProductsReturnModel {
  data: QuotationResponseModel | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// 견적서 품목 목록 조회
const useGetQuotationProducts = (
  quotationId?: number,
  factoryId?: number
): UseGetQuotationProductsReturnModel => {
  const [data, setData] = useState<QuotationResponseModel | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotationProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (quotationId) {
        params.append('quotation_id', quotationId.toString());
      }
      if (factoryId) {
        params.append('factory_id', factoryId.toString());
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/?${params.toString()}`,
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
        const errorMessage = errorData.message || '견적서 품목 조회에 실패했습니다.';
        
        // 품목이 없는 경우는 정상적인 상태로 처리
        if (errorMessage.includes('품목이 없습니다')) {
          setData(null);
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '견적서 품목 조회에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (quotationId || factoryId) {
      fetchQuotationProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationId, factoryId]);

  const refetch = () => {
    fetchQuotationProducts();
  };

  return { data, isLoading, error, refetch };
};

export default useGetQuotationProducts;
