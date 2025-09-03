import { useState, useCallback } from 'react';
import useMemberStore from '@/store/member-store';

const useDeleteProjectPlan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const deleteProjectPlan = useCallback(
    async (planId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          setError('Factory ID를 찾을 수 없습니다.');
          return { success: false, error: 'Factory ID를 찾을 수 없습니다.' };
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project-plan/${planId}?factory_id=${factoryId}`,
          {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 204) {
          // DELETE API returns 204 No Content on success
          return { success: true };
        } else {
          const errorData = await response.json();
          
          // 백엔드 에러 코드에 따른 구체적인 메시지
          switch (response.status) {
            case 400:
              setError('잘못된 요청입니다.');
              break;
            case 404:
              setError('해당 생산 계획을 찾을 수 없습니다.');
              break;
            case 500:
              setError('서버 내부 오류가 발생했습니다.');
              break;
            default:
              setError(errorData.detail || '생산 계획 삭제에 실패했습니다.');
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
    },
    [factoryId]
  );

  return { deleteProjectPlan, isLoading, error };
};

export default useDeleteProjectPlan;
