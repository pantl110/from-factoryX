import { useState, useCallback } from 'react';
import { ProjectStatusResponseModel } from '@/types/data-model';

// 프로젝트 상태 조회 훅
const useGetProjectStatus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProjectStatus = useCallback(async (projectId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // localStorage에서 factory_id 가져오기
      const factoryId = localStorage.getItem('factoryId');
      if (!factoryId) {
        throw new Error('factory_id를 찾을 수 없습니다.');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/${projectId}?factory_id=${factoryId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const result: ProjectStatusResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();

        // 백엔드 에러 코드에 따른 구체적인 메시지
        switch (response.status) {
          case 400:
            setError(errorData.detail || '잘못된 요청입니다.');
            break;
          case 403:
            setError('해당 공장에 대한 접근 권한이 없습니다.');
            break;
          case 404:
            setError('프로젝트를 찾을 수 없습니다.');
            break;
          case 500:
            setError('서버 내부 오류가 발생했습니다.');
            break;
          default:
            setError(errorData.detail || '프로젝트 상태 조회에 실패했습니다.');
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
  }, []);

  return { getProjectStatus, isLoading, error };
};

export default useGetProjectStatus; 