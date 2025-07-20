import { useState } from 'react';
import { ProjectLogModel } from '@/types/data-model';

interface CreateProjectLogRequestModel extends ProjectLogModel {
  project_id: number;
}

interface CreateProjectLogResponseModel {
  message: string;
}

const useCreateProjectLog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProjectLog = async (data: CreateProjectLogRequestModel) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/log`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
      if (response.status === 201) {
        const result: CreateProjectLogResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '프로젝트 로그 생성에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { createProjectLog, isLoading, error };
};

export default useCreateProjectLog;
