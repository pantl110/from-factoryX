'use client';

import { useCallback } from 'react';
import useTaxApi from './use-tax-api';
import { PublishedTaxInvoiceListResponseModel } from '@/types/data-model';

interface PublishedTaxInvoiceParamsModel {
  q?: string; // 거래처명 또는 품목명 통합 검색어
  tax_invoice_type?: 'sales' | 'purchase'; // 세금계산서 유형
  start_date?: string; // 시작일 (YYYY-MM-DD)
  end_date?: string; // 종료일 (YYYY-MM-DD)
  ordering?: string; // 정렬 순서: -transaction_date(최신순), transaction_date(오래된순)
  is_hidden?: boolean; // 숨김 여부
  page?: number;
  size?: number;
}

const useGetPublishedTaxInvoices = () => {
  const { callTaxApi, isLoading, error } = useTaxApi();

  const getPublishedTaxInvoices = useCallback(
    async (
      params: PublishedTaxInvoiceParamsModel
    ): Promise<{
      success: boolean;
      data?: PublishedTaxInvoiceListResponseModel;
    }> => {
      const queryParams: Record<string, string | number | boolean> = {};

      if (params.q) {
        queryParams.q = params.q;
      }
      if (params.tax_invoice_type) {
        queryParams.tax_invoice_type = params.tax_invoice_type;
      }
      if (params.start_date) {
        queryParams.start_date = params.start_date;
      }
      if (params.end_date) {
        queryParams.end_date = params.end_date;
      }
      if (params.ordering) {
        queryParams.ordering = params.ordering;
      }
      if (params.is_hidden !== undefined) {
        queryParams.is_hidden = params.is_hidden;
      }
      if (params.page) {
        queryParams.page = params.page;
      }
      if (params.size) {
        queryParams.size = params.size;
      }

      const result = await callTaxApi<PublishedTaxInvoiceListResponseModel>(
        'published',
        {
          queryParams,
        }
      );
      return result;
    },
    [callTaxApi]
  );

  return { getPublishedTaxInvoices, isLoading, error };
};

export default useGetPublishedTaxInvoices;
