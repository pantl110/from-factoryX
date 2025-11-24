'use client';

import { useMemo } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import { ExpiryRiskMaterialListResponseModel } from '@/types/data-model';

const useGetExpiryRiskMaterials = (q?: string) => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const isEnabled = useMemo(() => !!factoryId, [factoryId]);

  return useQuery<ExpiryRiskMaterialListResponseModel>({
    queryKey: ['expiry-risk-materials', factoryId, q ?? null],
    enabled: isEnabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!factoryId) {
        return {
          data: [],
          count: 0,
          totalCnt: 0,
          pageCnt: 0,
          curPage: 1,
          nextPage: null,
          previousPage: null,
        } as ExpiryRiskMaterialListResponseModel;
      }

      try {
        const response = await axios.get<ExpiryRiskMaterialListResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/expiry-risk`,
          {
            params: {
              factory_id: factoryId,
              ...(q ? { q } : {}),
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
            '유통기한 위험 원자재 조회에 실패했습니다.';
          throw new Error(message);
        }

        throw error;
      }
    },
  });
};

export default useGetExpiryRiskMaterials;
