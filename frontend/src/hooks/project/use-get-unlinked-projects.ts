'use client';

import { ProjectListResponseModel } from '@/types/data-model';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';

interface GetUnlinkedProjectsModel {
  search?: string; // 검색어 (업체명 또는 제품명)
  page?: number;
  page_size?: number;
  order_by?: string; // 정렬 필드 (-created_at, created_at 등)
}

const useGetUnlinkedProjects = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);
  const queryClient = useQueryClient();

  const getUnlinkedProjects = useCallback(
    async (params: GetUnlinkedProjectsModel) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await queryClient.fetchQuery<ProjectListResponseModel>({
          queryKey: [
            'unlinked-projects',
            factoryId,
            params.search,
            params.page,
            params.page_size,
            params.order_by,
          ],
          queryFn: async () => {
            if (!factoryId) {
              throw new Error('Factory ID를 찾을 수 없습니다.');
            }

            const queryParams = new URLSearchParams({
              factory_id: factoryId.toString(),
              tax_invoice__isnull: 'true', // 세금계산서가 연결되지 않은 프로젝트만 조회
              ...(params.page && { page: params.page.toString() }),
              ...(params.page_size && {
                page_size: params.page_size.toString(),
              }),
              ...(params.search && { search: params.search }),
              ...(params.order_by && { order_by: params.order_by }),
            });

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/v2/project?${queryParams.toString()}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              }
            );

            if (!response.ok) {
              if (response.status === 404) {
                throw new Error('프로젝트를 찾을 수 없습니다.');
              }
              if (response.status === 403) {
                throw new Error('접근 권한이 없습니다.');
              }

              const errorData = await response.json().catch(() => ({}));
              const errorMessage =
                (errorData as { detail?: string })?.detail ||
                '프로젝트 조회에 실패했습니다.';
              throw new Error(errorMessage);
            }

            const data: ProjectListResponseModel = await response.json();
            return data;
          },
        });

        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : '알 수 없는 오류가 발생했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient, factoryId]
  );

  return { getUnlinkedProjects, isLoading, error };
};

export default useGetUnlinkedProjects;
