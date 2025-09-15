import { useState, useCallback } from 'react';
import { CreateProjectResponseModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';

// 프로젝트 상태 업데이트
const useUpdateProjectStatus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const updateProjectStatus = useCallback(
    async (projectId: number, status: string) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        setError('공장 정보가 없습니다. 잠시 후 다시 시도해주세요.');
        setIsLoading(false);
        return { success: false, error: '공장 정보가 없습니다.' };
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project/${projectId}/status?factory_id=${factoryId}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
          }
        );

        if (response.status === 200) {
          const result: CreateProjectResponseModel = await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          setError(
            errorData.detail || '프로젝트 상태 업데이트에 실패했습니다.'
          );
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

  return { updateProjectStatus, isLoading, error };
};

export default useUpdateProjectStatus;
