'use client';

import { useMemo } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import {
  PublishedDocumentListResponseModel,
  PublishedDocumentFilterModel,
} from '@/types/data-model';

export interface PublishedDocumentParamsModel {
  filters: PublishedDocumentFilterModel;
  /**
   * 정렬 순서:
   * - '-transaction_date': 거래일자 최신순 (기본값)
   * - 'transaction_date': 거래일자 오래된순
   * - '-agreed_payment_date': 약정입금일 최신순
   * - 'agreed_payment_date': 약정입금일 오래된순
   */
  ordering?: string;
  page?: number; // 페이지 번호
  page_size?: number; // 페이지당 항목 수
}

// 발행된 세금계산서 및 현금영수증 조회 (Tax V2)
const useGetPublishedDocuments = (
  params: PublishedDocumentParamsModel,
  options?: { enabled?: boolean }
) => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const isQueryEnabled = useMemo(() => {
    if (options?.enabled === false) return false;
    return !!factoryId;
  }, [factoryId, options?.enabled]);

  const queryParams = useMemo(() => {
    if (!factoryId) {
      return {};
    }

    const query: Record<string, string | number | boolean | undefined> = {
      factory_id: factoryId,
    };

    // filters를 쿼리 파라미터로 평탄화
    if (params.filters.document_type) {
      query.document_type = params.filters.document_type;
    }
    if (params.filters.q) {
      query.q = params.filters.q;
    }
    if (params.filters.start_date) {
      query.start_date = params.filters.start_date;
    }
    if (params.filters.end_date) {
      query.end_date = params.filters.end_date;
    }
    if (params.filters.is_hidden !== undefined) {
      query.is_hidden = params.filters.is_hidden;
    }
    if (params.filters.account_status) {
      query.account_status = params.filters.account_status;
    }

    // ordering
    if (params.ordering) {
      query.ordering = params.ordering;
    }

    // pagination
    if (params.page) {
      query.page = params.page;
    }
    if (params.page_size) {
      query.page_size = params.page_size;
    }

    return query;
  }, [
    factoryId,
    params.filters,
    params.ordering,
    params.page,
    params.page_size,
  ]);

  return useQuery<PublishedDocumentListResponseModel>({
    queryKey: [
      'published-documents',
      factoryId,
      params.filters,
      params.ordering,
      params.page,
      params.page_size,
    ],
    queryFn: async () => {
      if (!factoryId) {
        throw new Error('Factory ID is not available');
      }

      try {
        const response = await axios.get<PublishedDocumentListResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/tax/published`,
          {
            params: queryParams,
            withCredentials: true,
          }
        );

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            '발행된 문서 조회에 실패했습니다.';
          throw new Error(message);
        }

        throw error;
      }
    },
    enabled: isQueryEnabled,
    staleTime: 1000 * 30, // 30초간 캐시 유지
    retry: 1,
  });
};

export default useGetPublishedDocuments;
