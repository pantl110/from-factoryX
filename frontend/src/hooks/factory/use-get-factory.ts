import { useState, useCallback } from 'react';
import {
  FactoriesListResponseModel,
  FactoriesResponseModel,
} from '@/types/data-model';

// 공장 설비 목록 조회
export const useGetFactoryList = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [factoryList, setFactoryList] =
    useState<FactoriesListResponseModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getFactoryList = useCallback(async (params?: { name?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();

      if (params?.name?.trim()) query.append('name', params.name.trim());

      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/factory${
        query.toString() ? `?${query.toString()}` : ''
      }`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();

        // 백엔드가 @paginate를 사용하므로 페이지네이션 형태로 응답이 올 수 있음

        let factoryListData: FactoriesListResponseModel;

        if (result && result.items) {
          // 페이지네이션된 응답인 경우
          factoryListData = {
            factories: result.items,
            count: result.count || result.items.length,
            // 필요시 페이지네이션 정보도 추가
            ...(result.total && { total: result.total }),
            ...(result.page && { page: result.page }),
            ...(result.pages && { pages: result.pages }),
          };
        } else if (Array.isArray(result)) {
          // 직접 배열로 온 경우
          factoryListData = {
            data: result,
            count: result.length,
            totalCnt: result.length,
            pageCnt: 1,
            curPage: 1,
            nextPage: null,
            previousPage: null,
          };
        } else {
          // 다른 형태의 응답인 경우
          factoryListData = result;
        }

        setFactoryList(factoryListData);
        return { success: true, data: factoryListData };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '공장 목록을 불러오지 못했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      console.error('Factory list fetch error:', err);
      const errorMessage = '서버 연결에 실패했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getFactoryList, factoryList, isLoading, error };
};

// 공장 상세 조회
export const useGetFactory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [factory, setFactory] = useState<FactoriesResponseModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getFactory = useCallback(async (factoryId: number) => {
    setIsLoading(true);
    setError(null);
    try {
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

      if (response.ok) {
        const result: FactoriesResponseModel = await response.json();
        setFactory(result);
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '공장 정보를 불러오지 못했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      console.error('Factory fetch error:', err);
      const errorMessage = '서버 연결에 실패했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getFactory, factory, isLoading, error };
};
