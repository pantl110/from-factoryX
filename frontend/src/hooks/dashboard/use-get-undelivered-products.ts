'use client';

import { useMemo } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import { UndeliveredProductListResponseModel } from '@/types/data-model';

interface UseUndeliveredProductsQueryParams {
  page?: number;
  baseDate?: string;
}

const EMPTY_RESPONSE: UndeliveredProductListResponseModel = {
  count: 0,
  totalCnt: 0,
  pageCnt: 0,
  curPage: 1,
  data: [],
};

const useGetUndeliveredProducts = (
  { page = 1, baseDate }: UseUndeliveredProductsQueryParams = {
    page: 1,
  }
) => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const queryEnabled = useMemo(() => !!factoryId, [factoryId]);

  return useQuery<UndeliveredProductListResponseModel>({
    queryKey: [
      'undelivered-quotation-products',
      factoryId,
      page,
      baseDate ?? null,
    ],
    queryFn: async () => {
      if (!factoryId) {
        return { ...EMPTY_RESPONSE, curPage: page };
      }

      try {
        const response = await axios.get<UndeliveredProductListResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/product/undelivered`,
          {
            params: {
              factory_id: factoryId,
              page,
              ...(baseDate ? { base_date: baseDate } : {}),
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
            '납품되지 않은 견적서 제품 조회에 실패했습니다.';
          throw new Error(message);
        }

        throw error;
      }
    },
    enabled: queryEnabled,
    staleTime: 1000 * 30,
    retry: 1,
    select: (data) => ({
      ...EMPTY_RESPONSE,
      ...data,
      curPage: data.curPage || page,
    }),
  });
};

export default useGetUndeliveredProducts;
