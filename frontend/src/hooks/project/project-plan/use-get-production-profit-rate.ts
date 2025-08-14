import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';
import { ProductionProfitRateModel } from '@/app/(with-layout)/dashboard/type';

interface GetProductionProfitRateParamsModel {
  target_date?: string; // YYYY-MM-DD
}

const useGetProductionProfitRate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useFactoryStore();

  const getProductionProfitRate = useCallback(
    async (params: GetProductionProfitRateParamsModel = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          const message = 'Factory ID를 찾을 수 없습니다.';
          setError(message);
          return { success: false, error: message } as const;
        }

        const search = new URLSearchParams();
        search.append('factory_id', factoryId.toString());
        if (params.target_date)
          search.append('target_date', params.target_date);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project-plan/profit-rate?${search.toString()}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.status === 200) {
          const data: ProductionProfitRateModel = await response.json();
          return { success: true, data } as const;
        }

        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.detail || '생산 수익률 조회에 실패했습니다.';
        setError(message);
        return { success: false, error: message } as const;
      } catch {
        const message = '서버 연결에 실패했습니다.';
        setError(message);
        return { success: false, error: message } as const;
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return { getProductionProfitRate, isLoading, error };
};

export default useGetProductionProfitRate;
