'use client';

import { useCallback, useState } from 'react';

interface UpdateMaterialHistoryPayloadModel {
  material_history_id: number[];
}

interface UpdateMaterialHistoryResponseModel {
  message: string;
}

const useUpdateMaterialHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMaterialHistory = useCallback(
    async (
      cashReceiptId: number,
      materialHistoryIds: number[]
    ): Promise<{
      success: boolean;
      data?: UpdateMaterialHistoryResponseModel;
      error?: string;
    }> => {
      setIsLoading(true);
      setError(null);

      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/receipt/${cashReceiptId}/update-material-history`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            material_history_id: materialHistoryIds,
          } as UpdateMaterialHistoryPayloadModel),
        });

        if (!response.ok) {
          const text = await response.text();
          let message = 'API 요청에 실패했습니다.';
          try {
            const parsed = JSON.parse(text);
            message = (parsed as any).message || (parsed as any).detail || message;
          } catch {
            message = text || message;
          }
          return { success: false, error: message };
        }

        const data: UpdateMaterialHistoryResponseModel = await response.json();
        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { updateMaterialHistory, isLoading, error };
};

export default useUpdateMaterialHistory;


