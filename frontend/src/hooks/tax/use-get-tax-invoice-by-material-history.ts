'use client';

import { useCallback } from 'react';
import useTaxApi from './use-tax-api';
import { TaxInvoiceByMaterialResponseModel } from '@/types/data-model';

const useGetTaxInvoiceByMaterialHistory = () => {
  const { callTaxApi, isLoading, error } = useTaxApi();

  const getTaxInvoiceByMaterialHistory = useCallback(
    async (
      materialHistoryId: number
    ): Promise<{
      success: boolean;
      data?: TaxInvoiceByMaterialResponseModel;
    }> => {
      const result = await callTaxApi<TaxInvoiceByMaterialResponseModel>(
        'invoice-by-material-history',
        {
          queryParams: { material_history_id: materialHistoryId },
        }
      );
      return result;
    },
    [callTaxApi]
  );

  return { getTaxInvoiceByMaterialHistory, isLoading, error };
};

export default useGetTaxInvoiceByMaterialHistory;
