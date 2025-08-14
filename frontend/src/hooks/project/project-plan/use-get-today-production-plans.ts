import { useState } from 'react';
import useFactoryStore from '@/store/factory-store';

interface TodayProductionPlanModel {
  company_name: string;
  product_name: string;
  product_code: string;
  spec: string;
  unit: string;
  production_quantity: number;
  equipment_name: string;
  production_time: number;
  project_id: number;
}

interface GetTodayProductionPlansModel {
  page?: number;
}

const useGetTodayProductionPlans = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useFactoryStore();

  const getTodayProductionPlans = async (
    params: GetTodayProductionPlansModel
  ) => {
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
      queryParams.append('page', (params.page || 1).toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project-plan/today?${queryParams}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result: TodayProductionPlanModel[] = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();

        // 404 에러는 데이터가 없는 것이므로 성공으로 처리
        if (response.status === 404) {
          return { success: true, data: [] };
        }

        // 다른 에러는 에러로 처리
        const errorMessage =
          errorData.detail || '오늘의 생산 일정 조회에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '서버 연결에 실패했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { getTodayProductionPlans, isLoading, error };
};

export default useGetTodayProductionPlans;
