'use client';
import { useState, useCallback } from 'react';

interface ConnectMaterialHistoryRequest {
  line_item_id: number;
  material_history_id: number;
}

interface ConnectMaterialHistoryResponse {
  message: string;
}

interface UseConnectMaterialHistoryReturn {
  connectMaterialHistory: (taxId: number, payload: ConnectMaterialHistoryRequest) => Promise<{
    success: boolean;
    data?: ConnectMaterialHistoryResponse;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

const useConnectMaterialHistory = (): UseConnectMaterialHistoryReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectMaterialHistory = useCallback(async (
    taxId: number,
    payload: ConnectMaterialHistoryRequest
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${taxId}/connect-material-history`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const result: ConnectMaterialHistoryResponse = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || '세금계산서와 자재 이력 연동에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = '서버 연결에 실패했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { connectMaterialHistory, isLoading, error };
};

export default useConnectMaterialHistory;