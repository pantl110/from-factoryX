import { useState } from 'react';
import { ProjectPlanModel } from '@/types/data-model';

// project_id로 해당 프로젝트의 모든 생산 계획을 조회
const useGetProjectPlans = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProjectPlans = async (projectId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/plan?project_id=${projectId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      if (response.status === 200) {
        const result: ProjectPlanModel[] = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '프로젝트 계획 조회에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { getProjectPlans, isLoading, error };
};

export default useGetProjectPlans;
