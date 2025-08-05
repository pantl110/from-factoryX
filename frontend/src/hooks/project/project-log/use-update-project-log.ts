import { useState } from 'react';
import { ProjectLogModel } from '@/types/data-model';

// 로컬스토리지에서 factoryId를 안전하게 가져오는 함수
const getStoredFactoryId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('factoryId');
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

interface UpdateProjectLogResponseModel {
  message: string;
}

const useUpdateProjectLog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProjectLog = async (logId: number, data: ProjectLogModel) => {
    setIsLoading(true);
    setError(null);

    // 로컬스토리지에서 factoryId 가져오기
    const factoryId = getStoredFactoryId();
    if (!factoryId) {
      setError('공장 정보가 없습니다.');
      setIsLoading(false);
      return { success: false, error: '공장 정보가 없습니다.' };
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/log/${logId}?factory_id=${factoryId}`,
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
        const result: UpdateProjectLogResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '프로젝트 로그 수정에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { updateProjectLog, isLoading, error };
};

export default useUpdateProjectLog;
