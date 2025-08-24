'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import useMemberStore from '@/store/member-store';

interface TaxApiResponseModel<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface TaxApiOptionsModel {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  queryParams?: Record<string, string | number | boolean>;
  abortSignal?: AbortSignal;
}

export type TaxApiEndpointType =
  | 'state'
  | 'published'
  | 'pending'
  | 'unlinked'
  | 'link'
  | 'invoice-by-material-history'
  | 'cash-receipts-sync'
  | 'cash-receipts-list'
  | 'cash-receipts-material-history'
  | 'update';

const useTaxApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useMemberStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  // 공통 API 호출 함수
  const callTaxApi = useCallback(
    async <T = unknown>(
      endpoint: TaxApiEndpointType,
      options: TaxApiOptionsModel = {}
    ): Promise<TaxApiResponseModel<T>> => {
      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 새로운 AbortController 생성
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      setIsLoading(true);
      setError(null);

      try {
        // factoryId가 없으면 API 호출 차단
        if (!factoryId) {
          return { 
            success: false, 
            error: '공장 정보가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.' 
          };
        }

        const { method = 'GET', body, queryParams = {} } = options;

        // factoryId를 queryParams에 추가
        queryParams.factory_id = factoryId;

        // URL 구성
        let url = `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${endpoint}`;

        // 특별한 엔드포인트들에 대한 URL 처리
        if (endpoint === 'update') {
          // update 엔드포인트는 tax_id를 path에 포함
          const taxId = queryParams.tax_id;
          if (taxId) {
            url = `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${taxId}`;
            // tax_id는 queryParams에서 제거 (path parameter로 사용됨)
            delete queryParams.tax_id;
          }
        } else if (endpoint === 'cash-receipts-sync') {
          url = `${process.env.NEXT_PUBLIC_API_URL}/v1/receipt/${factoryId}/sync`;
        } else if (endpoint === 'cash-receipts-list') {
          url = `${process.env.NEXT_PUBLIC_API_URL}/v1/receipt`;
        } else if (endpoint === 'cash-receipts-material-history') {
          url = `${process.env.NEXT_PUBLIC_API_URL}/v1/receipt/material-history`;
        }

        // queryParams를 URL에 추가
        const queryString = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryString.append(key, String(value));
          }
        });

        if (queryString.toString()) {
          url += `?${queryString.toString()}`;
        }

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 쿠키와 인증 정보 전송
          body: body ? JSON.stringify(body) : undefined,
          signal,
        });

        if (signal.aborted) {
          return { success: false, error: 'Request was aborted' };
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'API 요청에 실패했습니다.');
        }

        const data = await response.json();
        return { success: true, data };
      } catch (err) {
        if (signal.aborted) {
          return { success: false, error: 'Request was aborted' };
        }

        const errorMessage =
          err instanceof Error
            ? err.message
            : '알 수 없는 오류가 발생했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [factoryId]
  );

  // 컴포넌트 언마운트 시 진행 중인 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    callTaxApi,
    isLoading,
    error,
    factoryId,
  };
};

export default useTaxApi;
