import { useState } from 'react';

const useDeleteEquipment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteEquipment = async (factoryEqId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment/${factoryEqId}`,
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
      // 오류 처리 필요시 여기에 작성
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteEquipment, isLoading, error };
};

export default useDeleteEquipment;
