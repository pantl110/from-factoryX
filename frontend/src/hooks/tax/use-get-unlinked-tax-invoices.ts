'use client';

import { useCallback } from 'react';
import useTaxApi from './use-tax-api';
import { UnlinkedTaxInvoiceListResponseModel } from '@/types/data-model';

interface UnlinkedTaxInvoiceParamsModel {
  q?: string; // 거래처명 또는 제품명 통합 검색어
  page?: number;
  page_size?: number;
  is_hidden?: boolean; // 숨김 여부
  tax_invoice_type?: string; // sales-매출, purchase-매입
  publish_status?: string; // 발행 상태
  ordering?: string; // 정렬: -transaction_date(최신순), transaction_date(오래된순)
  start_date?: string; // 시작일 (YYYY-MM-DD)
  end_date?: string; // 종료일 (YYYY-MM-DD)
}

const useGetUnlinkedTaxInvoices = () => {
  const { callTaxApi, isLoading, error } = useTaxApi();

  const getUnlinkedTaxInvoices = useCallback(
    async (
      params: UnlinkedTaxInvoiceParamsModel
    ): Promise<{
      success: boolean;
      data?: UnlinkedTaxInvoiceListResponseModel;
    }> => {
      const queryParams: Record<string, string | number | boolean> = {};

      if (params.q) {
        queryParams.q = params.q;
      }
      if (params.page) {
        queryParams.page = params.page;
      }
      if (params.page_size) {
        queryParams.page_size = params.page_size;
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
      if (params.tax_invoice_type) {
        queryParams.tax_invoice_type = params.tax_invoice_type;
      }
      if (params.publish_status) {
        queryParams.publish_status = params.publish_status;
      }
      if (params.is_hidden !== undefined) {
        queryParams.is_hidden = params.is_hidden;
      }

      const result = await callTaxApi<UnlinkedTaxInvoiceListResponseModel>(
        'unlinked',
        {
          queryParams,
        }
      );
      return result;
    },
    [callTaxApi]
  );

  return { getUnlinkedTaxInvoices, isLoading, error };
};

export default useGetUnlinkedTaxInvoices;
