'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import useFactoryStore from '@/store/factory-store';

interface TaxApiResponseModel<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface TaxApiOptionsModel {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  queryParams?: Record<string, string | number>;
  abortSignal?: AbortSignal;
}

const useTaxApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useFactoryStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  // 공통 API 호출 함수
  const callTaxApi = useCallback(
    async <T>(
      endpoint: string,
      // 이전 요청이 진행 중이면 취소
      options: TaxApiOptionsModel = {}
    ): Promise<TaxApiResponseModel<T>> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 새로운 AbortController 생성
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          setError('Factory ID를 찾을 수 없습니다.');
          return { success: false, error: 'Factory ID를 찾을 수 없습니다.' };
        }

        // 기본 쿼리 파라미터에 factory_id 추가
        const queryParams = new URLSearchParams();
        queryParams.append('factory_id', factoryId.toString());

        // 추가 쿼리 파라미터가 있으면 추가
        if (options.queryParams) {
          Object.entries(options.queryParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value));
            }
          });
        }

        // URL 구성
        const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${endpoint}?${queryParams}`;

        // fetch 옵션 구성
        const fetchOptions: RequestInit = {
          method: options.method || 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          signal: abortController.signal,
        };

        // POST/PATCH 요청에 body 추가
        if (
          options.body &&
          (options.method === 'POST' || options.method === 'PATCH')
        ) {
          fetchOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, fetchOptions);

        // 요청이 취소되었는지 확인
        if (abortController.signal.aborted) {
          return { success: false, error: '요청이 취소되었습니다.' };
        }

        if (response.ok) {
          const result = await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.detail || 'API 호출에 실패했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch (err) {
        // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
        if (err instanceof Error && err.name === 'AbortError') {
          return { success: false, error: '요청이 취소되었습니다.' };
        }

        const errorMessage = '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        // 요청이 취소되지 않았을 때만 로딩 상태 해제
        if (!abortController.signal.aborted) {
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
