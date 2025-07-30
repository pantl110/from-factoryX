import { useState } from 'react';

//  완료된 프로젝트를 복제하여 생산 대기 상태로 새 프로젝트를 생성
//  - 거래명세서 발행일 초기화
//  - 세금계산서 연결 초기화
//  - 견적서, 생산 게획, 생산 로그 (메모만) 복제

const useCloneProject = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cloneProject = async (projectId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/clone`,
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
