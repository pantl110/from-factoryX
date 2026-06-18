'use client';

import { useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FactoriesResponseModel } from '@/types/data-model';

const FACTORY_LIST_QUERY_KEY = ['factory-list'];

const fetchFactoryList = async (): Promise<FactoriesResponseModel[]> => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/factory`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage =
      errorData?.detail || '공장 목록을 불러오지 못했습니다.';
    throw new Error(errorMessage);
  }

  const result: FactoriesResponseModel[] = await response.json();
  return result;
};

// 본인의 공장 목록 조회 (사용자가 멤버로 등록된 공장 목록)
export const useGetFactoryList = () => {
  const queryClient = useQueryClient();

  const factoryListQuery = useQuery<FactoriesResponseModel[], Error>({
    queryKey: FACTORY_LIST_QUERY_KEY,
    queryFn: fetchFactoryList,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
    retry: 1,
  });

  const getFactoryList = useCallback(async () => {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: FACTORY_LIST_QUERY_KEY,
        queryFn: fetchFactoryList,
        staleTime: 0,
      });

      return { success: true, data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '공장 목록을 불러오지 못했습니다.';
      return { success: false, error: errorMessage };
    }
  }, [queryClient]);

  return {
    getFactoryList,
    factoryList: factoryListQuery.data || null,
    isLoading: factoryListQuery.isLoading,
    error: factoryListQuery.error?.message || null,
  };
};

const FACTORY_DETAIL_QUERY_KEY = (factoryId: number) => [
  'factory-detail',
  factoryId,
];

const fetchFactoryDetail = async (
  factoryId: number
): Promise<FactoriesResponseModel> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/detail?factory_id=${factoryId}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage =
      errorData?.detail || '공장 정보를 불러오지 못했습니다.';
    throw new Error(errorMessage);
  }

  const result: FactoriesResponseModel = await response.json();
  return result;
};

// 공장 상세 조회
export const useGetFactory = () => {
  const queryClient = useQueryClient();
  const [currentFactoryId, setCurrentFactoryId] = useState<number | null>(null);

  // getFactory가 매 렌더마다 재생성되지 않도록 최신 factoryId를 ref로 추적
  const currentFactoryIdRef = useRef<number | null>(null);
  currentFactoryIdRef.current = currentFactoryId;

  const factoryQuery = useQuery<FactoriesResponseModel, Error>({
    queryKey:
      currentFactoryId !== null
        ? FACTORY_DETAIL_QUERY_KEY(currentFactoryId)
        : ['factory-detail', null],
    queryFn: () => {
      if (currentFactoryId === null) {
        throw new Error('Factory ID is required');
      }
      return fetchFactoryDetail(currentFactoryId);
    },
    enabled: currentFactoryId !== null,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
    retry: 1,
  });

  const getFactory = useCallback(
    async (factoryId: number) => {
      // factoryId가 변경되면 useQuery가 자동으로 새로운 데이터를 가져옵니다
      if (currentFactoryIdRef.current !== factoryId) {
        setCurrentFactoryId(factoryId);
        // factoryId가 변경되면 useQuery가 자동으로 실행되므로
        // refetch를 기다릴 필요는 없지만, 호환성을 위해 Promise를 반환합니다
        return { success: true, data: null };
      } else {
        // 같은 factoryId면 강제로 재조회 (queryClient로 처리해 의존성을 안정화)
        try {
          const data = await queryClient.fetchQuery({
            queryKey: FACTORY_DETAIL_QUERY_KEY(factoryId),
            queryFn: () => fetchFactoryDetail(factoryId),
            staleTime: 0,
          });
          return { success: true, data };
        } catch {
          return { success: false, error: '공장 정보를 불러오지 못했습니다.' };
        }
      }
    },
    [queryClient]
  );

  return {
    getFactory,
    factory: factoryQuery.data || null,
    isLoading: factoryQuery.isLoading,
    error: factoryQuery.error?.message || null,
  };
};
