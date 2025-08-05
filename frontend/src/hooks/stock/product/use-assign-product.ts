import { useState } from 'react';

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

interface AssignProductModel {
  factory_id: number;
  material_id: number;
  products: Array<{
    name: string;
    code: string;
    spec: string;
    unit: string;
    quantity: number;
  }>;
}

// 원자재 하나에 여러 품목을 연결
const useAssignProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignProduct = async (data: AssignProductModel) => {
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/assign?factory_id=${factoryId}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
      if (response.status === 201) {
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '품목 연결에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { assignProduct, isLoading, error };
};

export default useAssignProduct;
