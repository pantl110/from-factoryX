import { useState } from 'react';
import { ProductModel, ProductResponseModel } from '@/types/data-model';
import useFactoryStore from '@/store/factory-store';

const useCreateProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useFactoryStore((state) => state.factoryId);

  const createProduct = async (data: ProductModel) => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      const errorMessage = '공장 ID가 설정되지 않았습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product?factory_id=${factoryId}`;
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status === 201) {
        const result: ProductResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '품목 등록에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { createProduct, isLoading, error };
};

export default useCreateProduct;
