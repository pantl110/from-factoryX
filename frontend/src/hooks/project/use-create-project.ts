import { useState, useEffect } from 'react';
import useFactoryStore from '@/store/factory-store';

interface CreateProjectResponseModel {
  quotation_id: number;
  project_id: number;
  message?: string;
}

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

// 생산 시작 전 임시로 프로젝트에 빈 견적서 생성
// 프로젝트와 견적서를 동시에 생성합니다.
const useCreateProject = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = async () => {
    setIsLoading(true);
    setError(null);

    // 로컬스토리지에서 factoryId 가져오기
    const factoryId = getStoredFactoryId();
    if (!factoryId) {
      setError('공장 ID가 설정되지 않았습니다.');
      return { success: false, error: '공장 ID가 설정되지 않았습니다.' };
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/project?factory_id=${factoryId}`;
      console.log('API 호출 URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201) {
        const result: CreateProjectResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '프로젝트 생성에 실패했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { createProject, isLoading, error };
};

export default useCreateProject;
