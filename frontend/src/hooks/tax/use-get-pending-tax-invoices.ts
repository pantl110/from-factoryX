'use client';

import { useCallback } from 'react';
import useTaxApi from './use-tax-api';
import { PendingTaxInvoiceListResponseModel } from '@/types/data-model';

interface PendingTaxInvoiceParamsModel {
  q?: string; // 거래처명 또는 제품명 통합 검색어
  publish_status?: 'all' | 'pending' | 'temporary'; // 세금계산서 상태
  page?: number;
  page_size?: number;
  ordering?: string;
}

// 발행대기 또는 임시저장 상태의 세금계산서를 조회
const useGetPendingTaxInvoices = () => {
  const { callTaxApi, isLoading, error } = useTaxApi();

  const getPendingTaxInvoices = useCallback(
    async (
      params: PendingTaxInvoiceParamsModel
    ): Promise<{
      success: boolean;
      data?: PendingTaxInvoiceListResponseModel;
    }> => {
      const queryParams: Record<string, string | number> = {};

      if (params.q) {
        queryParams.q = params.q;
      }
      if (params.publish_status && params.publish_status !== 'all') {
        queryParams.publish_status = params.publish_status;
      }
      if (params.page) {
        queryParams.page = params.page;
      }
      if (params.page_size) {
        queryParams.page_size = params.page_size;
      }
      if (params.ordering) {
        queryParams.ordering = params.ordering;
      }

      const result = await callTaxApi<PendingTaxInvoiceListResponseModel>(
        'pending',
        {
          queryParams,
        }
      );
      return result;
    },
    [callTaxApi]
  );

  return { getPendingTaxInvoices, isLoading, error };
};

export default useGetPendingTaxInvoices;
