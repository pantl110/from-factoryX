import { useState } from 'react';
import { EquipmentResponseModel } from '@/types/data-model';

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

const useUpdateEquipment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateEquipment = async (
    factoryEqId: number,
    data: Partial<EquipmentResponseModel>
  ) => {
    setIsLoading(true);
    setError(null);

    // 로컬스토리지에서 factoryId 가져오기
    const factoryId = getStoredFactoryId();
    if (!factoryId) {
      setError('공장 정보가 없습니다.');
      setIsLoading(false);
      return { success: false, error: '공장 정보가 없습니다.' };
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment/${factoryEqId}?factory_id=${factoryId}`;

      const response = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const result: EquipmentResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const textError = await response.text();
          errorData = { detail: textError };
        }

        const errorMessage =
          errorData.detail ||
          errorData.message ||
          '설비 정보 수정에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { updateEquipment, isLoading, error };
};

export default useUpdateEquipment;
