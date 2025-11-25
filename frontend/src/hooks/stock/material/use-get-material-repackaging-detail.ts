'use client';

import { useMemo } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import { MaterialRepackagingResponseModel } from '@/types/data-model';

const useGetMaterialRepackagingDetail = (repackagingId: number | null) => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const isEnabled = useMemo(
    () => !!factoryId && repackagingId !== null,
    [factoryId, repackagingId]
  );

  return useQuery<MaterialRepackagingResponseModel>({
    queryKey: ['material-repackaging-detail', factoryId, repackagingId],
    enabled: isEnabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: 1,
    queryFn: async () => {
      if (!factoryId || repackagingId === null) {
        throw new Error('공장 ID 또는 소분 내역 ID가 설정되지 않았습니다.');
      }

      try {
        const response = await axios.get<MaterialRepackagingResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/repackaging/${repackagingId}`,
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
            '원자재 소분 내역 상세 조회에 실패했습니다.';
          throw new Error(message);
        }

        throw error;
      }
    },
  });
};

export default useGetMaterialRepackagingDetail;
