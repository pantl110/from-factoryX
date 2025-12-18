'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TaxInvoiceAccountModel } from '@/types/data-model';

interface UseGetTaxInvoiceAccountReturnModel {
  getTaxInvoiceAccount: (taxId: number) => Promise<{
    success: boolean;
    data?: TaxInvoiceAccountModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

const useGetTaxInvoiceAccount = (): UseGetTaxInvoiceAccountReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchTaxInvoiceAccount = useCallback(
    async (taxId: number): Promise<TaxInvoiceAccountModel> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/tax/account/${taxId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            '해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다.'
          );
        }
        if (response.status === 403) {
          throw new Error('접근 권한이 없습니다.');
        }
        if (response.status === 500) {
          throw new Error('서버 오류가 발생했습니다.');
        }
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { detail?: string })?.detail ||
          '세금계산서 채권/채무 정보 조회에 실패했습니다.';
        throw new Error(errorMessage);
      }

      const data: TaxInvoiceAccountModel = await response.json();
      return data;
    },
    []
  );

  const getTaxInvoiceAccount = useCallback(
    async (taxId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await queryClient.fetchQuery<TaxInvoiceAccountModel>({
          queryKey: ['tax-invoice-account', taxId],
          queryFn: () => fetchTaxInvoiceAccount(taxId),
        });

        return {
          success: true,
          data,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : '알 수 없는 오류가 발생했습니다.';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchTaxInvoiceAccount, queryClient]
  );

  return {
    getTaxInvoiceAccount,
    isLoading,
    error,
  };
};

export default useGetTaxInvoiceAccount;
