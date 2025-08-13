'use client';

import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';
import { CreateTaxInvoiceModel, TaxInvoiceDetailResponseModel } from '@/types/data-model';

interface CreateTaxInvoiceResponse {
  success: boolean;
  data?: TaxInvoiceDetailResponseModel;
  error?: string;
}

// 세금계산서 생성 훅
const useCreateTaxInvoice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTaxInvoice, setCreatedTaxInvoice] = useState<TaxInvoiceDetailResponseModel | null>(null);

  const createTaxInvoice = useCallback(async (payload: CreateTaxInvoiceModel): Promise<CreateTaxInvoiceResponse> => {
    setIsLoading(true);
    setError(null);
    setCreatedTaxInvoice(null);

    try {
      const factoryId = useFactoryStore.getState().factoryId;
      
      if (!factoryId) {
        const errorMessage = '공장 ID가 설정되지 않았습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // factory ID를 payload에서 제거하고 현재 공장 ID 사용
      const { factory, ...requestData } = payload;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/tax`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...requestData,
            factory: factoryId, // 현재 공장 ID 사용
          }),
        }
      );

      if (response.ok) {
        const result: TaxInvoiceDetailResponseModel = await response.json();
        setCreatedTaxInvoice(result);
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || errorData.message || '세금계산서 생성에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = '서버 연결에 실패했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { 
    createTaxInvoice, 
    createdTaxInvoice, 
    isLoading, 
    error,
    clearError: () => setError(null),
    clearCreatedTaxInvoice: () => setCreatedTaxInvoice(null)
  };
};

export default useCreateTaxInvoice;
