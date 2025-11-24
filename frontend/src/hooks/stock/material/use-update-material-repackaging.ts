'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import {
  UpdateMaterialRepackagingModel,
  MaterialRepackagingResponseModel,
} from '@/types/data-model';

interface UpdateMaterialRepackagingParamsModel {
  repackagingId: number;
  payload: UpdateMaterialRepackagingModel;
}

const useUpdateMaterialRepackaging = () => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      repackagingId,
      payload,
    }: UpdateMaterialRepackagingParamsModel) => {
      if (!factoryId) {
        throw new Error('공장 ID가 설정되지 않았습니다.');
      }

      const response = await axios.patch<MaterialRepackagingResponseModel>(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/repackaging/${repackagingId}`,
        payload,
        {
          params: {
            factory_id: factoryId,
          },
          withCredentials: true,
        }
      );

      return response.data;
    },
    onSuccess: () => {
      // 소분 내역 목록 쿼리 무효화
      if (factoryId) {
        queryClient.invalidateQueries({
          queryKey: ['material-repackagings', factoryId],
        });
      }
    },
  });
};

export default useUpdateMaterialRepackaging;

