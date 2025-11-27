'use client';

import { useMemo } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import { StaleConfirmedProjectModel } from '@/types/data-model';

const useGetStaleConfirmedProjects = () => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const isEnabled = useMemo(() => !!factoryId, [factoryId]);

  return useQuery<StaleConfirmedProjectModel[]>({
    queryKey: ['stale-confirmed-projects', factoryId],
    enabled: isEnabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!factoryId) {
        return [];
      }

      try {
        const response = await axios.get<StaleConfirmedProjectModel[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/project/stale-confirmed`,
          {
            params: {
              factory_id: factoryId,
            },
            withCredentials: true,
          }
        );

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            '확정 후 7일 경과 프로젝트 조회에 실패했습니다.';
          throw new Error(message);
        }

        throw error;
      }
    },
  });
};

export default useGetStaleConfirmedProjects;
