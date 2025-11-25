'use client';

import { useMemo } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import {
  MaterialRepackagingResponseModel,
  MaterialRepackagingListResponseModel,
} from '@/types/data-model';

interface UseGetMaterialRepackagingsOptions {
  page?: number;
  page_size?: number;
}

const useGetMaterialRepackagings = (
  materialId: number | null,
  options: UseGetMaterialRepackagingsOptions = {}
) => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const { page = 1, page_size = 5 } = options;

  const isEnabled = useMemo(
    () => !!factoryId && materialId !== null,
    [factoryId, materialId]
  );

  return useQuery<MaterialRepackagingListResponseModel>({
    queryKey: ['material-repackagings', factoryId, materialId, page, page_size],
    enabled: isEnabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: 1,
    queryFn: async () => {
      if (!factoryId || materialId === null) {
        return {
          count: 0,
          totalCnt: 0,
          pageCnt: 0,
          curPage: 1,
          nextPage: null,
          previousPage: null,
          data: [],
        };
      }

      try {
        const response = await axios.get<MaterialRepackagingListResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/repackaging`,
          {
            params: {
              factory_id: factoryId,
              material_id: materialId,
              page,
              page_size,
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
            '원자재 소분 내역 조회에 실패했습니다.';
          throw new Error(message);
        }

        throw error;
      }
    },
  });
};

export default useGetMaterialRepackagings;
