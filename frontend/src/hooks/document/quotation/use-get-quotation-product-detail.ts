import { QuotationProductResponseModel } from '@/types/data-model';
import { useState, useEffect } from 'react';

interface UseGetQuotationProductDetailReturnModel {
  data: QuotationProductResponseModel | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// 견적서 품목 상세 조회 // id는 quotation_product_id
const useGetQuotationProductDetail = (
  id: number
): UseGetQuotationProductDetailReturnModel => {
  const [data, setData] = useState<QuotationProductResponseModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotationProductDetail = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/product/${id}`,
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
        throw new Error(
          errorData.message || '견적서 품목 상세 조회에 실패했습니다.'
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : '견적서 품목 상세 조회에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchQuotationProductDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const refetch = () => {
    fetchQuotationProductDetail();
  };

  return { data, isLoading, error, refetch };
};

export default useGetQuotationProductDetail;
