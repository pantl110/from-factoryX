'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import useTaxApi from '../use-tax-api';
import { CashReceiptListResponseModel } from '@/types/data-model';

export interface CashReceiptQueryParamsModel {
  order?: 'asc' | 'desc';
  q?: string;
  page?: number;
  page_size?: number;
}

const useGetCashReceipts = (
  params: CashReceiptQueryParamsModel = {},
  options?: { enabled?: boolean }
) => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const { callTaxApi } = useTaxApi();

  const isQueryEnabled = useMemo(() => {
    if (options?.enabled === false) return false;
    return !!factoryId;
  }, [factoryId, options?.enabled]);

  const queryParams = useMemo(() => {
    const query: Record<string, string | number> = {};

    if (params.order) {
      query.order = params.order;
    }
    if (params.q) {
      query.q = params.q;
    }
    if (params.page) {
      query.page = params.page;
    }
    if (params.page_size) {
      query.page_size = params.page_size;
    }

    return query;
  }, [params.order, params.q, params.page, params.page_size]);

  return useQuery<CashReceiptListResponseModel>({
    queryKey: [
      'cash-receipts',
      factoryId,
      queryParams.order,
      queryParams.q,
      queryParams.page,
      queryParams.page_size,
    ],
    queryFn: async () => {
      if (!factoryId) {
        throw new Error('Factory ID is not available');
      }

      const result = await callTaxApi<CashReceiptListResponseModel>(
        'cash-receipts-list',
        {
          queryParams,
        }
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch cash receipts');
      }

      return result.data;
    },
    enabled: isQueryEnabled,
    staleTime: 1000 * 30, // 30초간 캐시 유지
    retry: 1,
  });
};

export default useGetCashReceipts;
