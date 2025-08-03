import { useState } from 'react';

//  완료된 프로젝트를 복제하여 생산 대기 상태로 새 프로젝트를 생성
//  - 거래명세서 발행일 초기화
//  - 세금계산서 연결 초기화
//  - 견적서, 생산 게획, 생산 로그 (메모만) 복제

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

const useCloneProject = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cloneProject = async (projectId: number) => {
    setIsLoading(true);
    setError(null);

    // factoryId 가져오기
    const factoryId = getStoredFactoryId();
    if (!factoryId) {
      setError('공장 정보가 없습니다. 잠시 후 다시 시도해주세요.');
      setIsLoading(false);
      return { success: false, error: '공장 정보가 없습니다.' };
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/clone?factory_id=${factoryId}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ project_id: projectId }),
        }
      );

      if (response.status === 200) {
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '프로젝트 복제에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { cloneProject, isLoading, error };
};

export default useCloneProject;
