'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import useMemberStore from '@/store/member-store';

const useDeleteMaterialRepackaging = () => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repackagingId: number) => {
      if (!factoryId) {
        throw new Error('공장 ID가 설정되지 않았습니다.');
      }

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/repackaging/${repackagingId}`,
        {
          params: {
            factory_id: factoryId,
          },
          withCredentials: true,
        }
      );
    },
    onSuccess: () => {
      // 소분 내역 목록 쿼리 무효화
      if (factoryId) {
        queryClient.invalidateQueries({
          queryKey: ['material-repackagings', factoryId],
        });
        // 원자재 히스토리 쿼리도 무효화 (잔량이 반환되므로)
        queryClient.invalidateQueries({
          queryKey: ['material-history'],
        });
      }
    },
  });
};

export default useDeleteMaterialRepackaging;

