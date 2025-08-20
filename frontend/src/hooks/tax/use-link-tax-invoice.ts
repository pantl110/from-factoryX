'use client';

import { useCallback } from 'react';
import useTaxApi from './use-tax-api';

interface LinkTaxInvoiceParamsModel {
  project_id: number;
  tax_id: number;
}

const useLinkTaxInvoice = () => {
  const { callTaxApi, isLoading, error } = useTaxApi();

  const linkTaxInvoice = useCallback(
    async (
      params: LinkTaxInvoiceParamsModel
    ): Promise<{ success: boolean }> => {
      const result = await callTaxApi('link', {
        method: 'POST',
        body: params,
      });
      return { success: result.success };
    },
    [callTaxApi]
  );

  return { linkTaxInvoice, isLoading, error };
};

export default useLinkTaxInvoice;
