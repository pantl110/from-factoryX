import { useState, useCallback } from 'react';
import {
  CreateProjectLogResponseModel,
  ProjectLogModel,
} from '@/types/data-model';
import useFactoryStore from '@/store/factory-store';

interface CreateProjectLogRequestModel extends ProjectLogModel {
  project_id: number;
}

const useCreateProjectLog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useFactoryStore((state) => state.factoryId);

  const createProjectLog = useCallback(
    async (data: CreateProjectLogRequestModel) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        setError('공장 정보가 없습니다. 잠시 후 다시 시도해주세요.');
        setIsLoading(false);
        return { success: false, error: '공장 정보가 없습니다.' };
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project/log?factory_id=${factoryId}`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        );
        if (response.status === 200) {
          const result: CreateProjectLogResponseModel = await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail ||
            errorData.message ||
            '프로젝트 로그 생성에 실패했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
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

  return { createProjectLog, isLoading, error };
};

export default useCreateProjectLog;
