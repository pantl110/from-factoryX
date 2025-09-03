'use client';

import { useCallback, useState, useRef, useEffect } from 'react';

interface ConnectMaterialHistoryParamsModel {
  tax_id: number;
  line_item_id: number;
  material_history_id: number;
}

interface ConnectMaterialHistoryResponseModel {
  message: string;
}

const useConnectMaterialHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const connectMaterialHistory = useCallback(
    async (
      params: ConnectMaterialHistoryParamsModel
    ): Promise<{
      success: boolean;
      data?: ConnectMaterialHistoryResponseModel;
      error?: string;
    }> => {
      // cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      setIsLoading(true);
      setError(null);
      try {
        const {
          tax_id: taxId,
          line_item_id: lineItemId,
          material_history_id: materialHistoryId,
        } = params;
        const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${taxId}/connect-material-history`;

        const response = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            line_item_id: lineItemId,
            material_history_id: materialHistoryId,
          }),
          signal,
        });

        if (signal.aborted) {
          return { success: false, error: 'Request was aborted' };
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'API 요청에 실패했습니다.');
        }

        const data: ConnectMaterialHistoryResponseModel = await response.json();
        return { success: true, data };
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          return { success: false, error: 'Request was aborted' };
        }
        const message =
          err instanceof Error
            ? err.message
            : '알 수 없는 오류가 발생했습니다.';
        setError(message);
        return { success: false, error: message };
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { connectMaterialHistory, isLoading, error };
};

export default useConnectMaterialHistory;
