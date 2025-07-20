import { useState } from 'react';
import { ProjectPlanListResponseModel } from '@/types/data-model';

interface PaginationParamsModel {
  page?: number;
  size?: number;
}

interface OngoingProjectPlansFiltersModel {
  client_name?: string; // 회사명으로 검색 가능
}

const useGetOngoingProjectPlans = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOngoingProject = async (
    pagination?: PaginationParamsModel,
    filters?: OngoingProjectPlansFiltersModel
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
      if (filters?.client_name) {
        params.append('client_name', filters.client_name);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/plan/ongoing?${params}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.status === 200) {
        const result: ProjectPlanListResponseModel = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(
          errorData.detail || '진행 중인 프로젝트 계획 조회에 실패했습니다.'
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

  return { getOngoingProject, isLoading, error };
};

export default useGetOngoingProjectPlans;
