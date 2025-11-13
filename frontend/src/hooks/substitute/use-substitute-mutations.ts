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
export const useDeleteSubstituteMutation = () => {
  const queryClient = useQueryClient();
  const factoryId = useMemberStore((state) => state.factoryId);

  return useMutation({
    mutationFn: async (substituteId: number) => {
      if (!factoryId) {
        throw new Error('공장 ID가 설정되지 않았습니다.');
      }

      const response = await axios.delete<{
        message: string;
        deleted_substitute_id: number;
      }>(`${API_BASE}/v2/substitute/relation/${substituteId}`, {
        params: {
          factory_id: factoryId,
        },
        withCredentials: true,
      });

      return { ...response.data, substituteId };
    },
    onSuccess: () => {
      // 삭제된 관계의 source_material을 알 수 없으므로, 모든 대체 자재 관계 쿼리를 무효화
      queryClient.invalidateQueries({
        queryKey: ['substitute', 'by-material'],
      });
    },
  });
};
