import { useState, useCallback } from 'react';
import { ClientListResponseModel } from '@/types/data-model';
import useFactoryStore from '@/store/factory-store';

interface GetClientParamsModel {
  factory_id: number;
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
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const factoryId = useFactoryStore((state) => state.factoryId);

  // 거래처 목록 조회 함수
  const getClients = useCallback(async (params: GetClientParamsModel) => {
    setIsLoading(true);
    setError(null);

    try {
      // 쿼리 파라미터 생성
      const queryParams = new URLSearchParams({
        factory_id: params.factory_id.toString(),
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
  }, []);

  // 검색 함수
  const searchClients = useCallback(
    async (keyword: string) => {
      if (!factoryId) return;

      setSearchKeyword(keyword);
      setCurrentPage(1); // 검색 시 첫 페이지로 리셋

      return await getClients({
        factory_id: factoryId,
        q: keyword,
        page: 1,
        page_size: pageSize,
      });
    },
    [factoryId, pageSize, getClients]
  );

  return {
    // 데이터
    clientList,
    isLoading,
    error,

    // 상태
    searchKeyword,
    currentPage,
    pageSize,

    // 상태 변경 함수
    setSearchKeyword,
    setCurrentPage,
    setPageSize,

    // API 호출 함수
    getClients,
    searchClients,

    // 유틸리티
    refetch: getClients,
  };
};

export default useGetClient;
