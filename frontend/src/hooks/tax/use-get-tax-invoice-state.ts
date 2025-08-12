'use client';

import { useCallback } from 'react';
import useTaxApi from './use-tax-api';

interface TaxInvoiceStateResponseModel {
  state: string;
  nts_state: string;
}

const useGetTaxInvoiceState = () => {
  const { callTaxApi, isLoading, error } = useTaxApi();

  const getTaxInvoiceState = useCallback(
    async (
      taxId: number
    ): Promise<{ success: boolean; data?: TaxInvoiceStateResponseModel }> => {
      const result = await callTaxApi<TaxInvoiceStateResponseModel>(
        `${taxId}/state`
      );
      return result;
    },
    [callTaxApi]
  );

  return { getTaxInvoiceState, isLoading, error };
};

export default useGetTaxInvoiceState;
