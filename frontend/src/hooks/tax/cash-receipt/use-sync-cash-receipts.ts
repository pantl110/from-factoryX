import { useCallback } from 'react';
import useTaxApi from '../use-tax-api';
import { CashReceiptSyncResponseModel } from '@/types/data-model';

export const useSyncCashReceipts = () => {
  const { callTaxApi, isLoading, error } = useTaxApi();

  const syncCashReceipts = useCallback(
    async (
      _factoryId: number
    ): Promise<{
      success: boolean;
      data?: CashReceiptSyncResponseModel;
      error?: string;
    }> => {
      const result = await callTaxApi<CashReceiptSyncResponseModel>(
        'cash-receipts-sync',
        {
          method: 'POST',
        }
      );

      return result;
    },
    [callTaxApi]
  );

  return {
    syncCashReceipts,
    isLoading,
    error,
  };
};
