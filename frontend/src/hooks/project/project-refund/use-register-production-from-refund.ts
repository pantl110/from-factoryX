import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';
import { RegisterProductionFromRefundResponseModel } from '@/types/data-model';

interface RegisterProductionFromRefundParamsModel {
  refund_id: number;
}

// 반품 정보를 기반으로 quotation product와 생산 계획을 생성
const useRegisterProductionFromRefund = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useFactoryStore();

  const registerProductionFromRefund = useCallback(
    async (params: RegisterProductionFromRefundParamsModel) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          setError('Factory ID를 찾을 수 없습니다.');
          return { success: false, error: 'Factory ID를 찾을 수 없습니다.' };
        }

        const queryParams = new URLSearchParams();
        queryParams.append('factory_id', factoryId.toString());

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project/refund/${params.refund_id}?${queryParams}`,
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
          return { success: false, error: errorMessage };
        }
      } catch {
        const errorMessage = '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return { registerProductionFromRefund, isLoading, error };
};

export default useRegisterProductionFromRefund;
