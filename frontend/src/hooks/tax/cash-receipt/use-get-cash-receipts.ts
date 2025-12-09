'use client';

import { useCallback, useState } from 'react';
import useTaxApi from '../use-tax-api';
import {
  CashReceiptResponseModel,
  CashReceiptListParamsModel,
  CashReceiptListResponseModel,
} from '@/types/data-model';

export const useGetCashReceipts = () => {
  const { callTaxApi, isLoading, error } = useTaxApi();
  const [cashReceipts, setCashReceipts] = useState<CashReceiptResponseModel[]>(
    []
  );
  const [totalPages, setTotalPages] = useState(1);

  const getCashReceipts = useCallback(
    async (
      params: CashReceiptListParamsModel
    ): Promise<{
      success: boolean;
      data?: CashReceiptListResponseModel;
      error?: string;
    }> => {
      const { factory_id: _factoryId, ...queryParams } = params;

      const result = await callTaxApi<CashReceiptListResponseModel>(
        'cash-receipts-list',
        {
          queryParams,
        }
      );

      if (result.success && result.data) {
        setCashReceipts(result.data.data || []);
        // 백엔드에서 페이지네이션 정보 받아오기
        setTotalPages(result.data.pageCnt || 1);
      }

      return result;
    },
    [callTaxApi]
  );

  return {
    getCashReceipts,
    cashReceipts,
    isLoading,
    error,
    totalPages,
  };
};
