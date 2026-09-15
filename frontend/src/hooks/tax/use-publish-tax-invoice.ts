'use client';

import { useState, useCallback, useRef } from 'react';
import useMemberStore from '@/store/member-store';

interface PublishTaxInvoiceResponseModel {
  success: boolean;
  data?: {
    message: string;
  };
  error?: string;
}

// 세금계산서 발행 훅
const usePublishTaxInvoice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const { factoryId } = useMemberStore();

  // 세금계산서 발행
  const publishTaxInvoice = useCallback(
    async (taxId: number): Promise<PublishTaxInvoiceResponseModel> => {
      if (inFlightRef.current) {
        return { success: false, error: '이미 발행 요청을 처리하고 있습니다.' };
      }
      inFlightRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          const errorMessage = '공장 ID가 설정되지 않았습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${taxId}/publish`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail ||
            errorData.message ||
            '세금계산서 발행에 실패했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch {
        const errorMessage = '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    publishTaxInvoice,
    isLoading,
    error,
    clearError,
  };
};

export default usePublishTaxInvoice;
