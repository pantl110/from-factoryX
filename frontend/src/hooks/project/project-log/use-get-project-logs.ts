import { useState } from 'react';
import { ProjectLogResponseModel } from '@/types/data-model';

interface PaginationParams {
  page?: number;
  size?: number;
}

const useGetProjectLogs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProjectLogs = async (projectId: number, pagination?: PaginationParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        project_id: projectId.toString(),
        ...(pagination?.page && { page: pagination.page.toString() }),
        ...(pagination?.size && { size: pagination.size.toString() }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/log?${params}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.status === 200) {
        const result: ProjectLogResponseModel[] = await response.json();
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
  };

  return { getProjectLogs, isLoading, error };
};

export default useGetProjectLogs; 