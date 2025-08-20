'use client';

import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';

interface RegisterProductionFromRefundResponseModel {
  message: string;
  action: string;
  refund_id: number;
  quotation_id: number;
  quotation_product_id: number;
  project_plan_id: number;
  production_log_id: number;
  product_name: string;
  quantity: number;
  equipment_name: string;
}

const useRegisterProductionFromRefund = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useFactoryStore((state) => state.factoryId);

  const registerProduction = useCallback(
    async (
      logId: number
    ): Promise<{
      success: boolean;
      data?: RegisterProductionFromRefundResponseModel;
    }> => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          setError('Factory ID를 찾을 수 없습니다.');
          return { success: false };
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project-refund/log/${logId}/production?factory_id=${factoryId}`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const result: RegisterProductionFromRefundResponseModel =
            await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail || '반품 생산 등록에 실패했습니다.';
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

  return { registerProduction, isLoading, error };
};

export default useRegisterProductionFromRefund;
