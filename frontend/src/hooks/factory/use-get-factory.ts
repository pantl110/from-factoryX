import { useState, useCallback } from 'react';
import {
  FactoriesResponseModel,
} from '@/types/data-model';

// 본인의 공장 목록 조회 (사용자가 멤버로 등록된 공장 목록)
export const useGetFactoryList = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [factoryList, setFactoryList] =
    useState<FactoriesResponseModel[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getFactoryList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/factory`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result: FactoriesResponseModel[] = await response.json();
        setFactoryList(result);
        return { success: true, data: result };
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
