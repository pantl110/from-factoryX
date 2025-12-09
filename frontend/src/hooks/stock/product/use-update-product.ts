'use client';

import { useState } from 'react';
import { ProductResponseModel, ProductModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';

const useUpdateProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const updateProduct = async (
    productId: number,
    data: Partial<ProductModel>
  ) => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      const errorMessage = '공장 ID가 설정되지 않았습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/${productId}?factory_id=${factoryId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result: ProductResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '제품 수정에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { updateProduct, isLoading, error };
};

export default useUpdateProduct;
