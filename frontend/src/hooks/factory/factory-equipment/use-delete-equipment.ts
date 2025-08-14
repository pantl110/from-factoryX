import { useState } from 'react';
import useFactoryStore from '@/store/factory-store';

const useDeleteEquipment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useFactoryStore((state) => state.factoryId);

  const deleteEquipment = async (factoryEqId: number) => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      setError('공장 정보가 없습니다.');
      setIsLoading(false);
      return { success: false, error: '공장 정보가 없습니다.' };
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment/${factoryEqId}?factory_id=${factoryId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      if (response.status === 204) {
        return { success: true };
      } else {
        let errorMsg = '설비 삭제에 실패했습니다.';
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch {
          // 오류 처리 필요시 여기에 작성
        }
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteEquipment, isLoading, error };
};

export default useDeleteEquipment;
