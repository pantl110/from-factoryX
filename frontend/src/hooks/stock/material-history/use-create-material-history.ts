import { useState } from 'react';
import {
  MaterialHistoryModel,
  MaterialHistoryResponseModel,
} from '@/types/data-model';

interface CreateMaterialHistoryResponseModel {
  materials: MaterialHistoryResponseModel[];
}

// 로컬스토리지에서 factoryId를 안전하게 가져오는 함수
const getStoredFactoryId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('factoryId');
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

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

    // 로컬스토리지에서 factoryId 가져오기
    const factoryId = getStoredFactoryId();
    if (!factoryId) {
      setError('공장 ID가 설정되지 않았습니다.');
      return { success: false, error: '공장 ID가 설정되지 않았습니다.' };
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/history?factory_id=${factoryId}`;
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

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
