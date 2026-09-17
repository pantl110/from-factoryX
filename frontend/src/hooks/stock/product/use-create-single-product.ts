'use client';

import { useState } from 'react';
import useMemberStore from '@/store/member-store';

interface CreateSingleProductModel {
  name: string;
  code: string;
  spec: string;
  unit: string;
  tax_type?: 'taxable' | 'exempt';
  current_stock?: number;
  average_production_time?: number;
}

interface CreateSingleProductResponseModel {
  factory_id: number;
  product_id: number;
}

// 온보딩 // 단일 제품 생성
const useCreateSingleProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const createSingleProduct = async (data: CreateSingleProductModel) => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      const errorMessage = '공장 ID가 설정되지 않았습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/single?factory_id=${factoryId}`;
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          factory_id: factoryId,
        }),
      });
      if (response.status === 201) {
        const result: CreateSingleProductResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '단일 제품 등록에 실패했습니다.');
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
