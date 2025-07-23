import { useState } from 'react';
import {
  MaterialHistoryModel,
  MaterialHistoryResponseModel,
} from '@/types/data-model';

interface CreateMaterialHistoryResponseModel {
  materials: MaterialHistoryResponseModel[];
}

const useCreateMaterialHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdMaterialHistory, setCreatedMaterialHistory] =
    useState<CreateMaterialHistoryResponseModel | null>(null);

  const createMaterialHistory = async (data: MaterialHistoryModel) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/history`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const result: CreateMaterialHistoryResponseModel =
          await response.json();
        setCreatedMaterialHistory(result);
        setIsSuccess(true);
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '원자재 이력 생성에 실패했습니다.';
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
  };

  return {
    createMaterialHistory,
    createdMaterialHistory,
    isLoading,
    error,
    isSuccess,
  };
};

export default useCreateMaterialHistory;
