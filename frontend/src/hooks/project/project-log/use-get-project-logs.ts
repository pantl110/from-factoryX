import { useState, useCallback } from 'react';
import { ProjectLogListResponseModel } from '@/types/data-model';

interface PaginationParamsModel {
  page?: number;
  size?: number;
}

const useGetProjectLogs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProjectLogs = useCallback(async (
    projectId: number,
    pagination?: PaginationParamsModel
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (pagination?.page) {
        params.append('page', pagination.page.toString());
      }
      if (pagination?.size) {
        params.append('size', pagination.size.toString());
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/log?project_id=${projectId}&${params}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.status === 200) {
        const result: ProjectLogListResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '프로젝트 로그 조회에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getProjectLogs, isLoading, error };
};

export default useGetProjectLogs;
