import { useState } from 'react';
import { ProjectResponseModel } from '@/types/data-model';

const useUpdateProjectTransactDate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProjectTransactDate = async (
    projectId: number,
    transactDate: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/${projectId}/transact-date`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transact_date: transactDate }),
        }
      );
      if (response.status === 200) {
        const result: ProjectResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(
          errorData.detail || '거래명세서 발급일 업데이트에 실패했습니다.'
        );
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { updateProjectTransactDate, isLoading, error };
};

export default useUpdateProjectTransactDate;
