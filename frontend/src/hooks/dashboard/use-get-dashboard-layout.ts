'use client';

import { useMemo } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import { DashboardLayoutResponseModel } from '@/types/data-model';

export const DASHBOARD_LAYOUT_QUERY_KEY = 'dashboard-layout';

const useGetDashboardLayout = () => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const isQueryEnabled = useMemo(() => !!factoryId, [factoryId]);

  return useQuery<DashboardLayoutResponseModel>({
    queryKey: [DASHBOARD_LAYOUT_QUERY_KEY, factoryId],
    enabled: isQueryEnabled,
    staleTime: 1000 * 60, // 1분
    gcTime: 1000 * 60 * 5, // 5분
    retry: 1,
    queryFn: async () => {
      if (!factoryId) {
        return { widgets: null };
      }

      try {
        const response = await axios.get<DashboardLayoutResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/factory/member/me/dashboard-layout`,
          {
            params: { factory_id: factoryId },
            withCredentials: true,
          }
        );

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            '대시보드 레이아웃 조회에 실패했습니다.';
          throw new Error(message);
        }

        throw error;
      }
    },
  });
};

export default useGetDashboardLayout;
