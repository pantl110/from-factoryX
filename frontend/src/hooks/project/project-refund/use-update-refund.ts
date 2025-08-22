'use client';

import { useState, useCallback } from 'react';
import useMemberStore from '@/store/member-store';

interface RefundUpdateInModel {
  refund_date?: string;
  current_stock?: number;
  production_amount?: number;
  product_id?: number;
}

interface RefundUpdateOutModel {
  message: string;
  refund_id: number;
  updated_project_plans: number[];
  deleted_project_plans: number[];
  created_project_plans: number[];
}

const useUpdateRefund = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const updateRefund = useCallback(
    async (
      refundId: number,
      payload: RefundUpdateInModel
    ): Promise<{ success: boolean; data?: RefundUpdateOutModel }> => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          setError('Factory ID를 찾을 수 없습니다.');
          return { success: false };
        }

        const queryParams = new URLSearchParams();
        queryParams.append('factory_id', factoryId.toString());

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project-refund/${refundId}?${queryParams}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          const result: RefundUpdateOutModel = await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.detail || '반품 수정에 실패했습니다.';
          setError(errorMessage);
          return { success: false };
        }
      } catch {
        const errorMessage = '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return { updateRefund, isLoading, error };
};

export default useUpdateRefund;
