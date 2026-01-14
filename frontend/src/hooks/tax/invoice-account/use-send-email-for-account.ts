'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface SendEmailPayloadModel {
  recipient: string;
  subject: string;
  content: string;
}

interface SendEmailResponseModel {
  message: string;
  recipient: string;
  invoice_sent_count: number;
}

interface UseSendEmailForAccountReturnModel {
  sendEmailForAccount: (
    id: number,
    payload: SendEmailPayloadModel
  ) => Promise<{
    success: boolean;
    data?: SendEmailResponseModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

const useSendEmailForAccount = (): UseSendEmailForAccountReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sendEmailForAccount = useCallback(
    async (id: number, payload: SendEmailPayloadModel) => {
      setIsLoading(true);
      setError(null);

      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/v2/account/send-email/${id}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          if (response.status === 400) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage =
              (errorData as { detail?: string })?.detail ||
              '잘못된 요청입니다.';
            throw new Error(errorMessage);
          }
          if (response.status === 404) {
            throw new Error(
              '해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다.'
            );
          }
          if (response.status === 500) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage =
              (errorData as { detail?: string })?.detail ||
              '이메일 발송 중 오류가 발생했습니다.';
            throw new Error(errorMessage);
          }
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            (errorData as { detail?: string })?.detail ||
            '이메일 발송에 실패했습니다.';
          throw new Error(errorMessage);
        }

        const data: SendEmailResponseModel = await response.json();

        // React Query 캐시 무효화하여 account 정보 다시 불러오기
        // 'tax-invoice-account'로 시작하는 모든 관련 쿼리 무효화 (타입 포함)
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return (
              Array.isArray(key) &&
              key[0] === 'tax-invoice-account' &&
              key[1] === id
            );
          },
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
    [queryClient]
  );

  return {
    sendEmailForAccount,
    isLoading,
    error,
  };
};

export default useSendEmailForAccount;
