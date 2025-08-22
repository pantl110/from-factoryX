import { useState } from 'react';
import { MaterialModel, MaterialResponseModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';

const useUpdateMaterial = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [updatedMaterial, setUpdatedMaterial] =
    useState<MaterialResponseModel | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const updateMaterial = async (
    materialId: number,
    data: Partial<MaterialModel>
  ) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    if (!factoryId) {
      setError('공장 정보가 없습니다. 잠시 후 다시 시도해주세요.');
      setIsLoading(false);
      return { success: false, error: '공장 정보가 없습니다.' };
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/${materialId}?factory_id=${factoryId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (response.ok) {
        const result: MaterialResponseModel = await response.json();
        setUpdatedMaterial(result);
        setIsSuccess(true);
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '원자재 수정에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateMaterial,
    updatedMaterial,
    isLoading,
    error,
    isSuccess,
  };
};

export default useUpdateMaterial;
