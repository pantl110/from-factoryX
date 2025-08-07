'use client';

import { CreateRefundModel, CreateRefundResponseModel } from '@/types/data-model';
import { useState } from 'react';

// localStorage에서 factoryId 가져오기
const getStoredFactoryId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('factoryId');
  }
  return null;
};

export const useCreateRefund = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRefund = async (data: CreateRefundModel): Promise<{ success: boolean; data?: CreateRefundResponseModel }> => {
    const factoryId = getStoredFactoryId();
    if (!factoryId) {
      setError('공장 정보가 없습니다. 잠시 후 다시 시도해주세요.');
      return { success: false };
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        factory_id: factoryId,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/refund?${queryParams}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '반품 생성에 실패했습니다.');
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '반품 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createRefund,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}; 