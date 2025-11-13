'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import {
  CreateSubstituteModel,
  SubstituteDetailResponseModel,
} from '@/types/data-model';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// React Query mutation: 대체 자재 관계 생성
export const useCreateSubstituteMutation = () => {
  const queryClient = useQueryClient();
  const factoryId = useMemberStore((state) => state.factoryId);

  return useMutation({
    mutationFn: async (data: CreateSubstituteModel) => {
      if (!factoryId) {
        throw new Error('공장 ID가 설정되지 않았습니다.');
      }

      const response = await axios.post<SubstituteDetailResponseModel>(
        `${API_BASE}/v2/substitute`,
        data,
        {
          params: {
            factory_id: factoryId,
          },
          withCredentials: true,
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      // 해당 source_material의 대체 자재 관계 목록을 다시 불러오도록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['substitute', 'by-material', data.source_material.id],
      });
    },
  });
};

// React Query mutation: 대체 자재 관계 삭제
// 새로운 API: DELETE /v2/substitute/{source_material_id}?target_material_id={target_material_id}
export const useDeleteSubstituteMutation = () => {
  const queryClient = useQueryClient();
  const factoryId = useMemberStore((state) => state.factoryId);

  return useMutation({
    mutationFn: async ({
      sourceMaterialId,
      targetMaterialId,
    }: {
      sourceMaterialId: number;
      targetMaterialId: number;
    }) => {
      if (!factoryId) {
        throw new Error('공장 ID가 설정되지 않았습니다.');
      }

      const response = await axios.delete<{
        message: string;
        source_material_id: number;
        removed_target_material_id: number;
      }>(`${API_BASE}/v2/substitute/${sourceMaterialId}`, {
        params: {
          factory_id: factoryId,
          target_material_id: targetMaterialId,
        },
        withCredentials: true,
      });

      return response.data;
    },
    onSuccess: (data, variables) => {
      // 삭제 성공 시 해당 source_material의 대체 자재 관계 목록을 다시 불러옴
      queryClient.invalidateQueries({
        queryKey: ['substitute', 'by-material', variables.sourceMaterialId],
      });
    },
  });
};
