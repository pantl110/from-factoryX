'use client';

import { useCallback } from 'react';
import useTaxApi from './use-tax-api';
import { UnlinkedTaxInvoiceListResponseModel } from '@/types/data-model';

interface UnlinkedTaxInvoiceParamsModel {
  q?: string; // 거래처명 검색어
  page?: number;
  size?: number;
}

const useGetUnlinkedTaxInvoices = () => {
  const { callTaxApi, isLoading, error } = useTaxApi();

  const getUnlinkedTaxInvoices = useCallback(
    async (
      params: UnlinkedTaxInvoiceParamsModel
    ): Promise<{
      success: boolean;
      data?: UnlinkedTaxInvoiceListResponseModel;
    }> => {
      const queryParams: Record<string, string | number> = {};

      if (params.q) {
        queryParams.q = params.q;
      }
      if (params.page) {
        queryParams.page = params.page;
      }
      if (params.size) {
        queryParams.size = params.size;
      }

      const result = await callTaxApi<UnlinkedTaxInvoiceListResponseModel>(
        'unlinked',
        {
          queryParams,
        }
      );
      return result;
    },
    [callTaxApi]
  );

  return { getUnlinkedTaxInvoices, isLoading, error };
};

export default useGetUnlinkedTaxInvoices;
