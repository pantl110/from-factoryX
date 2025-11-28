import { useState } from 'react';
import { MaterialHistoryResponseModel } from '@/types/data-model';

interface SingleMaterialHistoryCreateModel {
  material_id: number;
  client_id: number;
  type: 'purchase' | 'consumption'; // 구매 또는 소모
  quantity: number; // 재고 변동 수량
  price?: number | null; // 구매 단가 // 구매 시에만 입력
}

//특정 원자재의 구매 또는 소모 이력을 생성합니다. 재고가 자동으로 업데이트됩니다.
const useCreateSingleMaterialHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdHistory, setCreatedHistory] =
    useState<MaterialHistoryResponseModel | null>(null);

  const createSingleMaterialHistory = async (
    data: SingleMaterialHistoryCreateModel
  ) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material-history/single`,
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
        const result: MaterialHistoryResponseModel = await response.json();
        setCreatedHistory(result);
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
    createSingleMaterialHistory,
    createdHistory,
    isLoading,
    error,
    isSuccess,
  };
};

export default useCreateSingleMaterialHistory;
