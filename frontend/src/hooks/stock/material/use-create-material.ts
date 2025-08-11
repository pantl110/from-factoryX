import { CreateMaterialModel } from '@/types/data-model';
import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';

// 원자재 생성 응답 모델
export interface CreateMaterialResponseModel {
  material_ids: number[];
  message: string;
}

// 원자재 생성 훅 반환 모델
export interface UseCreateMaterialReturnModel {
  createMaterial: (materials: CreateMaterialModel[]) => Promise<{
    success: boolean;
    data?: CreateMaterialResponseModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

// 원자재 생성 훅
const useCreateMaterial = (): UseCreateMaterialReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useFactoryStore((state) => state.factoryId);

  const createMaterial = useCallback(
    async (materials: CreateMaterialModel[]) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        const errorMessage = '공장 ID가 설정되지 않았습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material?factory_id=${factoryId}`;

        const response = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(materials),
        });

        if (response.status === 201) {
          const result: CreateMaterialResponseModel = await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail || '원자재 생성에 실패했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return { createMaterial, isLoading, error };
};

export default useCreateMaterial;
