'use client';

import { useMemo } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import { MobileDashboardCountsResponseModel } from '@/types/data-model';

const INITIAL_COUNTS: MobileDashboardCountsResponseModel = {
  undelivered_quotation_products: 0,
  shortage_materials: 0,
  expiry_risk_materials: 0,
  stale_confirmed_projects: 0,
};

interface UseMobileDashboardCountsModel {
  baseDate?: string | null;
}

const useGetMobileDashboardCounts = (
  { baseDate }: UseMobileDashboardCountsModel = { baseDate: null }
) => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const isQueryEnabled = useMemo(() => !!factoryId, [factoryId]);

  return useQuery<MobileDashboardCountsResponseModel>({
    queryKey: ['mobile-dashboard-counts', factoryId, baseDate ?? null],
    enabled: isQueryEnabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: 1,
    queryFn: async () => {
      if (!factoryId) {
        return INITIAL_COUNTS;
      }

      try {
        const response = await axios.get<MobileDashboardCountsResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project-plan/dashboard-mobile`,
          {
            params: {
              factory_id: factoryId,
              ...(baseDate ? { base_date: baseDate } : {}),
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
            '모바일 대시보드 지표 조회에 실패했습니다.';
          throw new Error(message);
        }

        throw error;
      }
    },
    select: (data) => ({
      ...INITIAL_COUNTS,
      ...data,
    }),
  });
};

export default useGetMobileDashboardCounts;
