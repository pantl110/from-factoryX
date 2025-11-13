'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import { SubstituteListResponseModel } from '@/types/data-model';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// React Query: 자재 ID로 해당 자재가 source_material인 대체 자재 관계들 조회
export const useSubstitutesByMaterialQuery = (
  materialId: number | null,
  enabled: boolean = true,
  page: number = 1,
  pageSize: number = 5
) => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const isEnabled = enabled && !!factoryId && !!materialId;

  return useQuery({
    queryKey: [
      'substitute',
      'by-material',
      materialId,
      factoryId,
      page,
      pageSize,
    ],
    queryFn: async () => {
      if (!factoryId || !materialId) {
        return {
          data: [],
          count: 0,
          totalCnt: 0,
          pageCnt: 0,
          curPage: 1,
          nextPage: null,
          previousPage: null,
        } as SubstituteListResponseModel;
      }

      const url = `${API_BASE}/v2/substitute/${materialId}`;

      try {
        const response = await axios.get<SubstituteListResponseModel>(url, {
          params: {
            factory_id: factoryId,
            page,
            page_size: pageSize,
          },
          withCredentials: true,
        });

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            // 404는 데이터가 없는 것으로 처리 (빈 배열 반환)
            return {
              data: [],
              count: 0,
              totalCnt: 0,
              pageCnt: 0,
              curPage: 1,
              nextPage: null,
              previousPage: null,
            } as SubstituteListResponseModel;
          }
        }
        throw error;
      }
    },
    enabled: isEnabled,
    retry: false,
  });
};
