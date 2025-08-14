import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';
import { DailyProductionQuantityModel } from '@/app/(with-layout)/dashboard/type';

interface GetDailyProductionQuantityModel {
  target_date?: string; // YYYY-MM-DD 형식, 기본값: 오늘
}

const useGetDailyProductionQuantity = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useFactoryStore();

  const getDailyProductionQuantity = useCallback(
    async (params: GetDailyProductionQuantityModel) => {
      setIsLoading(true);
      setError(null);

      try {
        // Zustand store에서 factoryId 가져오기
        if (!factoryId) {
          setError('Factory ID를 찾을 수 없습니다.');
          return { success: false, error: 'Factory ID를 찾을 수 없습니다.' };
        }

        const queryParams = new URLSearchParams();
        queryParams.append('factory_id', factoryId.toString());

        // target_date가 있으면 추가
        if (params.target_date) {
          queryParams.append('target_date', params.target_date);
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project/plan/daily?${queryParams}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 200) {
          const result: DailyProductionQuantityModel = await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail || '오늘 생산량 조회에 실패했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch {
        setError('서버 연결에 실패했습니다.');
        return { success: false, error: '서버 연결에 실패했습니다.' };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return { getDailyProductionQuantity, isLoading, error };
};

export default useGetDailyProductionQuantity;
