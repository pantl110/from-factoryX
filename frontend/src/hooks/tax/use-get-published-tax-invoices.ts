'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import useTaxApi from './use-tax-api';
import { PublishedTaxInvoiceListResponseModel } from '@/types/data-model';

export interface PublishedTaxInvoiceParamsModel {
  q?: string; // 거래처명 또는 제품명 통합 검색어
  tax_invoice_type?: 'sales' | 'purchase'; // 세금계산서 유형
  start_date?: string; // 시작일 (YYYY-MM-DD)
  end_date?: string; // 종료일 (YYYY-MM-DD)
  ordering?: string; // 정렬 순서: -transaction_date(최신순), transaction_date(오래된순)
  is_hidden?: boolean; // 숨김 여부
  page?: number; // 페이지 번호
  page_size?: number; // 페이지당 항목 수
}

// 발행된 세금계산서 목록 조회 // 작성일자 정렬 최신순이 default
const useGetPublishedTaxInvoices = (
  params: PublishedTaxInvoiceParamsModel = {},
  options?: { enabled?: boolean }
) => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const { callTaxApi } = useTaxApi();

  const isQueryEnabled = useMemo(() => {
    if (options?.enabled === false) return false;
    return !!factoryId;
  }, [factoryId, options?.enabled]);

  const queryParams = useMemo(() => {
    const query: Record<string, string | number | boolean> = {};

    if (params.q) {
      query.q = params.q;
    }
    if (params.tax_invoice_type) {
      query.tax_invoice_type = params.tax_invoice_type;
    }
    if (params.start_date) {
      query.start_date = params.start_date;
    }
    if (params.end_date) {
      query.end_date = params.end_date;
    }
    if (params.is_hidden !== undefined) {
      query.is_hidden = params.is_hidden;
    }
    if (params.ordering) {
      query.ordering = params.ordering;
    }
    if (params.page) {
      query.page = params.page;
    }
    if (params.page_size) {
      query.page_size = params.page_size;
    }

    return query;
  }, [
    params.q,
    params.tax_invoice_type,
    params.start_date,
    params.end_date,
    params.is_hidden,
    params.ordering,
    params.page,
    params.page_size,
  ]);

  return useQuery<PublishedTaxInvoiceListResponseModel>({
    queryKey: [
      'published-tax-invoices',
      factoryId,
      queryParams.q,
      queryParams.tax_invoice_type,
      queryParams.start_date,
      queryParams.end_date,
      queryParams.ordering,
      queryParams.is_hidden,
      queryParams.page,
      queryParams.page_size,
    ],
    queryFn: async () => {
      if (!factoryId) {
        throw new Error('Factory ID is not available');
      }

      const result = await callTaxApi<PublishedTaxInvoiceListResponseModel>(
        'published',
        {
          queryParams,
        }
      );

      if (!result.success || !result.data) {
        throw new Error(
          result.error || 'Failed to fetch published tax invoices'
        );
      }

      return result.data;
    },
    enabled: isQueryEnabled,
    staleTime: 1000 * 30, // 30초간 캐시 유지
    retry: 1,
  });
};

export default useGetPublishedTaxInvoices;
