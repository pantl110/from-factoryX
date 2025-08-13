import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';
import { TaxInvoiceDetailResponseModel } from '@/types/data-model';

// 세금계산서 상세 조회 훅
const useGetTaxInvoiceDetail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxInvoice, setTaxInvoice] = useState<TaxInvoiceDetailResponseModel | null>(null);

  const getTaxInvoice = useCallback(async (taxId: number) => {
    setIsLoading(true);
    setError(null);
    setTaxInvoice(null);

    try {
      const factoryId = useFactoryStore.getState().factoryId;
      
      if (!factoryId) {
        const errorMessage = '공장 ID가 설정되지 않았습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${taxId}?factory_id=${factoryId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result: TaxInvoiceDetailResponseModel = await response.json();
        setTaxInvoice(result);
        return { success: true, data: result };
      } else if (response.status === 404) {
        const errorMessage = '해당 세금계산서를 찾을 수 없습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || '세금계산서 조회에 실패했습니다.';
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
    getTaxInvoice, 
    taxInvoice, 
    isLoading, 
    error,
    clearError: () => setError(null),
    clearTaxInvoice: () => setTaxInvoice(null)
  };
};

export default useGetTaxInvoiceDetail;
