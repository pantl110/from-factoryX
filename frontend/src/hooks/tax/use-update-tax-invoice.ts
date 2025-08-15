'use client';

import { useCallback, useState } from 'react';
import useTaxApi from './use-tax-api';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';

// 세금계산서 수정을 위한 입력 데이터 타입
export interface TaxInvoiceUpdateModel {
  factory: number;
  client?: number;
  product?: number[];
  line_items?: Array<{
    purchase_expiry: string; // YYYYMMDD 형식
    name: string; // 품목명
    information?: string; // 규격
    chargeable_unit: string; // 수량
    unit_price: string; // 단가
    amount: string; // 공급가액
    tax: string; // 세액
    description?: string; // 비고
  }>;
  transaction_date?: string;
  transaction_amount: number; // 필수 필드로 변경
  tax_amount: number; // 필수 필드로 변경
  is_hidden?: boolean;
}

// 세금계산서 수정 응답 타입
export interface TaxInvoiceUpdateResponseModel {
  success: boolean;
  data?: PublishedTaxInvoiceResponseModel;
  error?: string;
}

// 세금계산서 수정 훅
const useUpdateTaxInvoice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { callTaxApi } = useTaxApi();

  const updateTaxInvoice = useCallback(
    async (
      taxId: number,
      updateData: TaxInvoiceUpdateModel
    ): Promise<TaxInvoiceUpdateResponseModel> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await callTaxApi<PublishedTaxInvoiceResponseModel>(
          'update',
          {
            method: 'PATCH',
            body: updateData,
            queryParams: { tax_id: taxId },
          }
        );

        if (result.success) {
          return { success: true, data: result.data };
        } else {
          setError(result.error || '세금계산서 수정에 실패했습니다.');
          return {
            success: false,
            error: result.error || '세금계산서 수정에 실패했습니다.',
          };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : '알 수 없는 오류가 발생했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [callTaxApi]
  );

  return {
    updateTaxInvoice,
    isLoading,
    error,
  };
};

export default useUpdateTaxInvoice;
