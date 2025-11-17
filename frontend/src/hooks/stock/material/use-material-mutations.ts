'use client';

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import { MaterialListResponseModel } from '@/types/data-model';

export interface MaterialFilterModel {
  page?: number;
  page_size?: number;
  q?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  material_id?: number; // 대체자재 필터링을 위한 파라미터
  status?: 'shortage';
}

// 원자재 목록 조회 mutation
export const useGetMaterialListMutation = () => {
  const factoryId = useMemberStore((state) => state.factoryId);

  return useMutation({
    mutationFn: async (filters: MaterialFilterModel = {}) => {
      if (!factoryId) {
        throw new Error('공장 ID가 설정되지 않았습니다.');
      }

      const params: Record<string, string | number> = {
        factory_id: factoryId,
      };

      if (filters.page) params.page = filters.page.toString();
      if (filters.page_size) params.page_size = filters.page_size.toString();
      if (filters.q) params.q = filters.q;
      if (filters.order) params.order = filters.order;
      if (filters.limit) params.limit = filters.limit.toString();
      if (filters.material_id) params.material_id = filters.material_id;
      if (filters.status) params.status = filters.status;

      const response = await axios.get<MaterialListResponseModel>(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material`,
        {
          params,
          withCredentials: true,
        }
      );

      return response.data;
    },
  });
};
