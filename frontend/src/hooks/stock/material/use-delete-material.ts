import { useState } from 'react';
import useMemberStore from '@/store/member-store';

const useDeleteMaterial = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const factoryId = useMemberStore((state) => state.factoryId);

  const deleteMaterial = async (materialId: number) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/${materialId}?factory_id=${factoryId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (response.ok) {
        setIsSuccess(true);
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '원자재 삭제에 실패했습니다.');
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
    deleteMaterial,
    isLoading,
    error,
    isSuccess,
  };
};

export default useDeleteMaterial;
