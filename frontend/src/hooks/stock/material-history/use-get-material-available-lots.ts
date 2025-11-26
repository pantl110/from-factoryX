'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import { MaterialAvailableLotListResponseModel } from '@/types/data-model';

const useGetMaterialAvailableLots = (
  materialId: number | null,
  page: number = 1,
  pageSize: number = 5
) => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const isEnabled = useMemo(
    () => !!factoryId && materialId !== null,
    [factoryId, materialId]
  );

  return useQuery<MaterialAvailableLotListResponseModel>({
    queryKey: [
      'material-available-lots',
      factoryId,
      materialId,
      page,
      pageSize,
    ],
    enabled: isEnabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: 1,
    queryFn: async (): Promise<MaterialAvailableLotListResponseModel> => {
      if (!factoryId || materialId === null) {
        return {
          data: [],
          count: 0,
          totalCnt: 0,
          pageCnt: 0,
          curPage: 1,
          nextPage: null,
          previousPage: null,
        };
      }

      const response = await axios.get<MaterialAvailableLotListResponseModel>(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/history/available-lots`,
        {
          params: {
            factory_id: factoryId,
            material_id: materialId,
            page,
            page_size: pageSize,
          },
          withCredentials: true,
        }
      );

      return response.data;
    },
  });
};

export default useGetMaterialAvailableLots;
