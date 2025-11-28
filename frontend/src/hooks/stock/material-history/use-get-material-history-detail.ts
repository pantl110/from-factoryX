'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import { MaterialHistoryDetailOutModel } from '@/types/data-model';

const useGetMaterialHistoryDetail = (historyId: number | null) => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const isEnabled = useMemo(
    () => !!factoryId && historyId !== null,
    [factoryId, historyId]
  );

  return useQuery<MaterialHistoryDetailOutModel>({
    queryKey: ['material-history-detail', factoryId, historyId],
    enabled: isEnabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: 1,
    queryFn: async (): Promise<MaterialHistoryDetailOutModel> => {
      if (!factoryId || historyId === null) {
        throw new Error('공장 ID 또는 이력 ID가 설정되지 않았습니다.');
      }

      try {
        const response = await axios.get<MaterialHistoryDetailOutModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/stock/material-history/${historyId}`,
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
            '원자재 이력 조회에 실패했습니다.';
          throw new Error(message);
        }
        throw new Error('서버 연결에 실패했습니다.');
      }
    },
  });
};

export default useGetMaterialHistoryDetail;
