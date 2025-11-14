'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import { WorkInstructionHistoryResponseModel } from '@/types/data-model';

// React Query: 작업 지시서 변경 이력 조회
export const useWorkInstructionHistoryQuery = (
  workInstructionId: number | null,
  enabled: boolean = true
) => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const isEnabled = enabled && !!factoryId && !!workInstructionId;

  return useQuery({
    queryKey: ['work-instruction', 'history', workInstructionId, factoryId],
    queryFn: async () => {
      if (!factoryId || !workInstructionId) {
        return [] as WorkInstructionHistoryResponseModel[];
      }

      try {
        const response = await axios.get<WorkInstructionHistoryResponseModel[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/document/work-instruction/${workInstructionId}/history`,
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
          const status = error.response?.status;
          const errorData = error.response?.data;

          // 404는 데이터가 없는 것으로 처리 (빈 배열 반환)
          if (status === 404) {
            return [] as WorkInstructionHistoryResponseModel[];
          }

          // 다른 에러는 throw
          throw new Error(
            errorData?.detail || '작업 지시서 변경 이력 조회에 실패했습니다.'
          );
        }
        throw error;
      }
    },
    enabled: isEnabled,
    retry: false,
  });
};
