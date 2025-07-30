import { useState } from 'react';

interface AssignMaterialProductModel {
  factory_id: number;
  product_id: number;
  materials: Array<{
    name: string;
    code: string;
    spec: string;
    quantity: number;
  }>;
}

// 온보딩 // 원자재 생성 및 품목 연결
const useAssignMaterialProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignMaterialProduct = async (data: AssignMaterialProductModel) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/assign`,
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
