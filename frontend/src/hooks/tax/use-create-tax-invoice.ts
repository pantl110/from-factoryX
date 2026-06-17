'use client';

import { useState, useCallback } from 'react';
import useMemberStore from '@/store/member-store';
import {
  CreateTaxInvoiceModel,
  PublishedTaxInvoiceResponseModel,
} from '@/types/data-model';

interface CreateTaxInvoiceResponseModel {
  success: boolean;
  data?: PublishedTaxInvoiceResponseModel;
  error?: string;
}

// 세금계산서 생성 훅
const useCreateTaxInvoice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTaxInvoice, setCreatedTaxInvoice] =
    useState<PublishedTaxInvoiceResponseModel | null>(null);

  const createTaxInvoice = useCallback(
    async (
      payload: CreateTaxInvoiceModel
    ): Promise<CreateTaxInvoiceResponseModel> => {
      setIsLoading(true);
      setError(null);
      setCreatedTaxInvoice(null);

      try {
        const { factoryId } = useMemberStore.getState();

        if (!factoryId) {
          const errorMessage = '공장 ID가 설정되지 않았습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...payload,
              factory: factoryId,
            }),
          }
        );

        if (response.ok) {
          const result: PublishedTaxInvoiceResponseModel =
            await response.json();
          setCreatedTaxInvoice(result);
          return { success: true, data: result };
        } else {
          const errorData = await response.json().catch(() => ({}));
          const detail = errorData?.detail;
          let errorMessage = '세금계산서 생성에 실패했습니다.';
          if (typeof detail === 'string') {
            errorMessage = detail;
          } else if (Array.isArray(detail)) {
            // Pydantic 422 검증 에러: [{ loc, msg }] → 읽기 좋은 메시지로 변환
            errorMessage =
              detail
                .map((e) => {
                  const field = Array.isArray(e?.loc)
                    ? e.loc[e.loc.length - 1]
                    : '';
                  return field ? `${field}: ${e?.msg}` : e?.msg;
                })
                .filter(Boolean)
                .join('\n') || errorMessage;
          } else if (detail && typeof detail === 'object') {
            errorMessage = JSON.stringify(detail);
          }
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch {
        const errorMessage = '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    createTaxInvoice,
    createdTaxInvoice,
    isLoading,
    error,
    clearError: () => setError(null),
    clearCreatedTaxInvoice: () => setCreatedTaxInvoice(null),
  };
};

export default useCreateTaxInvoice;
