'use client';

import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { QuotationProductResponseModel } from '@/types/data-model';

interface UseGetQuotationProductsReturnModel {
  data: QuotationProductResponseModel[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// 견적서 제품 목록 조회
const useGetQuotationProducts = (
  quotationId?: number,
  factoryId?: number
): UseGetQuotationProductsReturnModel => {
  const [data, setData] = useState<QuotationProductResponseModel[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotationProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, number> = {};
      if (quotationId) {
        params.quotation_id = quotationId;
      }
      if (factoryId) {
        params.factory_id = factoryId;
      }

      const response = await axios.get<QuotationProductResponseModel[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/product/`,
        {
          params,
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setData(response.data);
    } catch (err) {
      let errorMessage = '견적서 제품 조회에 실패했습니다.';

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message?: string }>;
        errorMessage =
          axiosError.response?.data?.message ||
          axiosError.message ||
          errorMessage;

        if (errorMessage.includes('제품이 없습니다')) {
          setData([]);
          setError(null);
          return;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

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
