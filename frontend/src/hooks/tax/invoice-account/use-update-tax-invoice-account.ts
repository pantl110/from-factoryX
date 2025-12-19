'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import { CollectionTermsType } from '@/types/status-type';

interface UpdateTaxInvoiceAccountPayloadModel {
  collection_terms: CollectionTermsType | null;
  collection_terms_custom: string | null;
  agreed_payment_date: string | null;
  notes: string | null;
}

interface UseUpdateTaxInvoiceAccountReturnModel {
  updateTaxInvoiceAccount: (
    taxId: number,
    payload: UpdateTaxInvoiceAccountPayloadModel
  ) => Promise<{
    success: boolean;
    data?: TaxInvoiceAccountModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

const useUpdateTaxInvoiceAccount =
  (): UseUpdateTaxInvoiceAccountReturnModel => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const updateTaxInvoiceAccount = useCallback(
      async (taxId: number, payload: UpdateTaxInvoiceAccountPayloadModel) => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v2/account/${taxId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(payload),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage =
              (errorData as { detail?: string })?.detail ||
              '세금계산서 채권/채무 정보 저장에 실패했습니다.';
            throw new Error(errorMessage);
          }

          const data: TaxInvoiceAccountModel = await response.json();

          // React Query 캐시 업데이트
          queryClient.setQueryData<TaxInvoiceAccountModel>(
            ['tax-invoice-account', taxId],
            (prev) => (prev ? { ...prev, ...data } : data)
          );

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
      [queryClient]
    );

    return {
      updateTaxInvoiceAccount,
      isLoading,
      error,
    };
  };

export default useUpdateTaxInvoiceAccount;
