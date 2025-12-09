'use client';

import { useState, useCallback } from 'react';
import { ClientListResponseModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';

interface GetClientParamsModel {
  q?: string; // 검색어
  page?: number;
  page_size?: number;
}

const useGetClient = () => {
  const [clientList, setClientList] = useState<ClientListResponseModel | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;
  const factoryId = useMemberStore((state) => state.factoryId);

  // 거래처 목록 조회 함수
  const getClients = useCallback(
    async (params: GetClientParamsModel = {}) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        setError('공장 ID가 설정되지 않았습니다.');
        setIsLoading(false);
        return { success: false, error: '공장 ID가 설정되지 않았습니다.' };
      }

      try {
        // 쿼리 파라미터 생성
        const queryParams = new URLSearchParams({
          factory_id: factoryId.toString(),
          page: (params.page || 1).toString(),
          page_size: (params.page_size || 10).toString(),
        });

        // 검색어가 있으면 추가
        if (params.q && params.q.trim()) {
          queryParams.append('q', params.q.trim());
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/client?${queryParams}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (response.ok) {
          const result: ClientListResponseModel = await response.json();
          setClientList(result);
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail || '거래처 목록을 불러오는데 실패했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch {
        const errorMessage = '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  // 전체 거래처 목록을 한 번에 가져오는 함수 // 검색 가능
  const getAllClientList = useCallback(
    async (searchQuery?: string) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        setError('공장 ID가 설정되지 않았습니다.');
        setIsLoading(false);
        return { success: false, error: '공장 ID가 설정되지 않았습니다.' };
      }

      try {
        // 먼저 전체 개수를 조회
        const countQueryParams = new URLSearchParams({
          factory_id: factoryId.toString(),
          page: '1',
          page_size: '1',
        });

        if (searchQuery && searchQuery.trim()) {
          countQueryParams.append('q', searchQuery.trim());
        }

        const countResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/client?${countQueryParams}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (!countResponse.ok) {
          const errorData = await countResponse.json();
          const errorMessage =
            errorData.detail || '거래처 목록을 불러오는데 실패했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }

        const countResult = await countResponse.json();
        const totalCount = countResult.totalCnt || 0;

        if (totalCount === 0) {
          setClientList({
            count: 0,
            totalCnt: 0,
            pageCnt: 1,
            curPage: 1,
            nextPage: null,
            previousPage: null,
            data: [],
          });
          return {
            success: true,
            data: {
              count: 0,
              totalCnt: 0,
              pageCnt: 1,
              curPage: 1,
              nextPage: null,
              previousPage: null,
              data: [],
            },
          };
        }

        // 전체 개수만큼 한 번에 가져오기
        const allQueryParams = new URLSearchParams({
          factory_id: factoryId.toString(),
          page: '1',
          page_size: totalCount.toString(),
        });

        if (searchQuery && searchQuery.trim()) {
          allQueryParams.append('q', searchQuery.trim());
        }

        const allResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/client?${allQueryParams}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (allResponse.ok) {
          const result: ClientListResponseModel = await allResponse.json();
          setClientList(result);
          return { success: true, data: result };
        } else {
          const errorData = await allResponse.json();
          const errorMessage =
            errorData.detail || '거래처 목록을 불러오는데 실패했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch {
        const errorMessage = '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return {
    // 데이터
    clientList,
    isLoading,
    error,

    // 상태
    pageSize,

    // 함수
    getClients,
    getAllClientList,
  };
};

export default useGetClient;
