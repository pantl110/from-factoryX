import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';
import { UpdateProjectPlanModel } from '@/types/data-model';

interface UpdateProjectPlanResponseModel {
  message: string;
}

// 생산 계획의 기기, 수량, 상태, 일정 등을 수정
// 만약 가동 중인 설비가 변경된다면 프로젝트 로그도 생성
const useUpdateProjectPlan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useFactoryStore((state) => state.factoryId);

  const updateProjectPlan = useCallback(
    async (planId: number, data: UpdateProjectPlanModel) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          throw new Error('공장 정보가 없습니다.');
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project/plan/${planId}?factory_id=${factoryId}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        );
        if (response.status === 200) {
          const result: UpdateProjectPlanResponseModel = await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          setError(errorData.detail || '프로젝트 계획 수정에 실패했습니다.');
          return { success: false, error: errorData.detail };
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

  return { updateProjectPlan, isLoading, error };
};

export default useUpdateProjectPlan;
