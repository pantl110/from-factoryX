'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import { ProjectPlanModel } from '@/types/data-model';

// Query key factory
export const PROJECT_PLANS_QUERY_KEY = (
  projectId: number | null,
  factoryId: number | null
) => ['project-plans', projectId, factoryId];

// project_id로 해당 프로젝트의 모든 생산 계획을 조회
const useGetProjectPlans = () => {
  const queryClient = useQueryClient();
  const factoryId = useMemberStore((state) => state.factoryId);

  const fetchProjectPlans = async (
    projectId: number
  ): Promise<ProjectPlanModel[]> => {
    if (!factoryId) {
      throw new Error('공장 정보가 없습니다.');
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/project-plan?project_id=${projectId}&factory_id=${factoryId}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (response.ok) {
      const result: ProjectPlanModel[] = await response.json();
      return result;
    } else {
      const errorData = await response.json();
      const errorMessage =
        errorData.detail || '프로젝트 계획 조회에 실패했습니다.';
      throw new Error(errorMessage);
    }
  };

  const getProjectPlans = async (projectId: number) => {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: PROJECT_PLANS_QUERY_KEY(projectId, factoryId),
        queryFn: () => fetchProjectPlans(projectId),
        staleTime: 0,
      });
      return { success: true, data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '서버 연결에 실패했습니다.';
      return { success: false, error: errorMessage };
    }
  };

  // 하위 호환성을 위해 isLoading과 error 반환 (현재 활성 쿼리 상태 확인)
  const getCurrentQueryState = (projectId: number | null) => {
    if (!projectId || !factoryId) {
      return { isLoading: false, error: null };
    }
    const queryState = queryClient.getQueryState(
      PROJECT_PLANS_QUERY_KEY(projectId, factoryId)
    );
    return {
      isLoading: queryState?.status === 'pending' || false,
      error: queryState?.error
        ? (queryState.error instanceof Error
            ? queryState.error.message
            : '프로젝트 계획 조회에 실패했습니다.')
        : null,
    };
  };

  return { getProjectPlans, getCurrentQueryState };
};

// React Query hook for project plans
export const useProjectPlansQuery = (projectId: number | null) => {
  const factoryId = useMemberStore((state) => state.factoryId);

  return useQuery<ProjectPlanModel[], Error>({
    queryKey: PROJECT_PLANS_QUERY_KEY(projectId, factoryId),
    queryFn: () => {
      if (!projectId || !factoryId) {
        throw new Error('프로젝트 ID 또는 공장 ID가 없습니다.');
      }
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project-plan?project_id=${projectId}&factory_id=${factoryId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      ).then(async (response) => {
        if (response.ok) {
          return response.json();
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail || '프로젝트 계획 조회에 실패했습니다.';
          throw new Error(errorMessage);
        }
      });
    },
    enabled: !!projectId && !!factoryId,
    staleTime: 0,
    retry: 1,
  });
};

export default useGetProjectPlans;
