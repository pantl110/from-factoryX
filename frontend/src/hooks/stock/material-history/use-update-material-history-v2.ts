'use client';

import { useState } from 'react';
import {
  MaterialHistoryDetailOutModel,
  MaterialHistoryUpdateInModel,
} from '@/types/data-model';
import useMemberStore from '@/store/member-store';

const useUpdateMaterialHistoryV2 = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [updatedHistory, setUpdatedHistory] =
    useState<MaterialHistoryDetailOutModel | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const updateMaterialHistory = async (
    historyId: number,
    data: MaterialHistoryUpdateInModel
  ) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    if (!factoryId) {
      const errorMessage = '공장 ID가 설정되지 않았습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/stock/material-history/${historyId}?factory_id=${factoryId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const result: MaterialHistoryDetailOutModel = await response.json();
        setUpdatedHistory(result);
        setIsSuccess(true);
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '원자재 이력 수정에 실패했습니다.';
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
    updateMaterialHistory,
    updatedHistory,
    isLoading,
    error,
    isSuccess,
  };
};

export default useUpdateMaterialHistoryV2;
