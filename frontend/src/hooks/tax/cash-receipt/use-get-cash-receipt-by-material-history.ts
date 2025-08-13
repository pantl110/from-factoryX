import { useCallback } from 'react';
import useTaxApi from '../use-tax-api';
import { CashReceiptByMaterialModel } from '@/types/data-model';

export const useGetCashReceiptByMaterialHistory = () => {
  const { callTaxApi, isLoading, error } = useTaxApi();

  const getCashReceiptByMaterialHistory = useCallback(
    async (materialHistoryId: number): Promise<{
      success: boolean;
      data?: CashReceiptByMaterialModel;
      error?: string;
    }> => {
      const result = await callTaxApi<CashReceiptByMaterialModel>('cash-receipts-material-history', {
        queryParams: { material_history_id: materialHistoryId },
      });

      return result;
    },
    [callTaxApi]
  );

  return {
    getCashReceiptByMaterialHistory,
    isLoading,
    error,
  };
};
