import { useState } from 'react';
import useFactoryStore from '@/store/factory-store';

interface AssignMaterialProductModel {
  product_id: number;
  materials: Array<{
    name: string;
    code: string;
    spec: string;
    unit: string;
    quantity: number | null;
    price: number | null;
  }>;
}

// 온보딩 // 원자재 생성 및 품목 연결까지
const useAssignMaterialProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useFactoryStore((state) => state.factoryId);

  const assignMaterialProduct = async (data: AssignMaterialProductModel) => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      const errorMessage = '공장 ID가 설정되지 않았습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/assign?factory_id=${factoryId}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            factory_id: factoryId,
          }),
        }
      );
      if (response.status === 201) {
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '원자재 연결에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { assignMaterialProduct, isLoading, error };
};

export default useAssignMaterialProduct;
