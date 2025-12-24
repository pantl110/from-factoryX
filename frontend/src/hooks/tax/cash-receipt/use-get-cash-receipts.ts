'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import { CashReceiptListResponseModel } from '@/types/data-model';

export interface CashReceiptQueryParamsModel {
  order?: 'asc' | 'desc';
  q?: string;
  page?: number;
  page_size?: number;
  is_hidden?: boolean;
  account_status?: string; // 채권/채무 상태 (waiting-대기, overdue-연체, partial-일부, completed-완료)
}

const useGetCashReceipts = (
  params: CashReceiptQueryParamsModel = {},
  options?: { enabled?: boolean }
) => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const isQueryEnabled = useMemo(() => {
    if (options?.enabled === false) return false;
    return !!factoryId;
  }, [factoryId, options?.enabled]);

  const queryParams = useMemo(() => {
    const query: Record<string, string | number | boolean> = {};

    if (factoryId) {
      query.factory_id = factoryId;
    }

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
    if (params.is_hidden !== undefined) {
      query.is_hidden = params.is_hidden;
    }
    if (params.account_status) {
      query.account_status = params.account_status;
    }

    return query;
  }, [
    factoryId,
    params.order,
    params.q,
    params.page,
    params.page_size,
    params.is_hidden,
    params.account_status,
  ]);

  return useQuery<CashReceiptListResponseModel>({
    queryKey: [
      'cash-receipts',
      factoryId,
      queryParams.order,
      queryParams.q,
      queryParams.page,
      queryParams.page_size,
      queryParams.is_hidden,
      queryParams.account_status,
    ],
    queryFn: async () => {
      if (!factoryId) {
        throw new Error('Factory ID is not available');
      }

      const response = await axios.get<CashReceiptListResponseModel>(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/receipt`,
        {
          params: queryParams,
          withCredentials: true,
        }
      );

      return response.data;
    },
    enabled: isQueryEnabled,
    staleTime: 1000 * 30, // 30초간 캐시 유지
    retry: 1,
  });
};

export default useGetCashReceipts;
