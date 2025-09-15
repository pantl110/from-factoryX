import { useState } from 'react';
import useMemberStore from '@/store/member-store';

const useDeleteProject = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const deleteProject = async (projectId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!factoryId) {
        setError('Factory ID를 찾을 수 없습니다.');
        return { success: false, error: 'Factory ID를 찾을 수 없습니다.' };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/${projectId}?factory_id=${factoryId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.status === 200) {
        const result: { message: string } = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '프로젝트 삭제에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteProject, isLoading, error };
};

export default useDeleteProject;
