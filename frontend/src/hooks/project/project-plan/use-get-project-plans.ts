import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';
import { ProjectPlanModel } from '@/types/data-model';

// project_id로 해당 프로젝트의 모든 생산 계획을 조회
const useGetProjectPlans = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useFactoryStore((state) => state.factoryId);

  const getProjectPlans = useCallback(async (projectId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!factoryId) {
        throw new Error('공장 정보가 없습니다.');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/plan?project_id=${projectId}&factory_id=${factoryId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const result: ProjectPlanModel[] = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();

        // 백엔드 에러 코드에 따른 구체적인 메시지
        switch (response.status) {
          case 404:
            setError('해당 프로젝트를 찾을 수 없거나 생산 계획이 없습니다.');
            break;
          case 500:
            setError('서버 내부 오류가 발생했습니다.');
            break;
          default:
            setError(errorData.detail || '프로젝트 계획 조회에 실패했습니다.');
        }
        return { success: false, error: errorData.detail };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '서버 연결에 실패했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [factoryId]);

  return { getProjectPlans, isLoading, error };
};

export default useGetProjectPlans;
