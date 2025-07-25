import { useState } from 'react';

interface CreateSingleProductModel {
  factory_id: number;
  name: string;
  code: string;
  spec: string;
  unit: string;
}

interface CreateSingleProductResponseModel {
  factory_id: number;
  product_id: number;
}

// 온보딩 // 단일 품목 생성
const useCreateSingleProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSingleProduct = async (data: CreateSingleProductModel) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/single`,
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
        const result: CreateSingleProductResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '단일 품목 등록에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { createSingleProduct, isLoading, error };
};

export default useCreateSingleProduct;
