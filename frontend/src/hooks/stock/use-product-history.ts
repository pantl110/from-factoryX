import {
  ProductHistoryListResponseModel,
  ProductHistoryModel,
  ProductHistoryResponseModel,
} from '@/types/data-model';
import { useState, useCallback } from 'react';

// 로컬스토리지에서 factoryId를 안전하게 가져오는 함수
const getStoredFactoryId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('factoryId');
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

export interface ProductHistoryFilterModel {
  product_id?: number; // 제품 ID (product -> product_id로 변경)
  start_date?: string; // 조회 시작일 (YYYY-MM-DD)
  end_date?: string; // 조회 종료일 (YYYY-MM-DD)
  page?: number; // 페이지 번호
  page_size?: number; // 페이지 크기
}

const useProductHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<
    ProductHistoryResponseModel | ProductHistoryListResponseModel | null
  >(null);

  // Create product history 제품 입출고 내역 등록
  const createProductHistory = useCallback(
    async (payload: ProductHistoryModel) => {
      setIsLoading(true);
      setError(null);

      // 로컬스토리지에서 factoryId 가져오기
      const factoryId = getStoredFactoryId();
      if (!factoryId) {
        setError('공장 정보가 없습니다.');
        setIsLoading(false);
        return { success: false, error: '공장 정보가 없습니다.' };
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/history?factory_id=${factoryId}`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const result = await res.json();
        if (res.status === 201) {
          setData(result);
          return { success: true, data: result };
        } else {
          setError(result.message || '등록에 실패했습니다.');
          return { success: false, error: result.message };
        }
      } catch {
        setError('서버 연결에 실패했습니다.');
        return { success: false, error: '서버 연결에 실패했습니다.' };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // List product histories (paginated)제품 입출고 이력 목록 조회
  const listProductHistories = useCallback(
    async (filters: ProductHistoryFilterModel = {}) => {
      setIsLoading(true);
      setError(null);

      // 로컬스토리지에서 factoryId 가져오기
      const factoryId = getStoredFactoryId();
      if (!factoryId) {
        setError('공장 정보가 없습니다.');
        setIsLoading(false);
        return { success: false, error: '공장 정보가 없습니다.' };
      }

      try {
        // eslint-disable-next-line camelcase
        const { product_id, ...otherFilters } = filters;
        const params = new URLSearchParams();
        Object.entries(otherFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null)
            params.append(key, String(value));
        });

        // product_id를 쿼리 파라미터로 추가
        // eslint-disable-next-line camelcase
        if (product_id) {
          params.append('product_id', String(product_id));
        }

        // factory_id 추가
        params.append('factory_id', factoryId.toString());

        const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/history?${params.toString()}`;

        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
        });
        const result = await res.json();

        if (res.ok) {
          setData(result);
          return { success: true, data: result };
        } else {
          setError(
            result.message || '제품 입출고 이력 목록 조회에 실패했습니다.'
          );
          return { success: false, error: result.message };
        }
      } catch {
        setError('서버 연결에 실패했습니다.');
        return { success: false, error: '서버 연결에 실패했습니다.' };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get single product history // 제품 입출고 이력 상세 조회
  const getProductHistory = useCallback(
    async (filters: ProductHistoryFilterModel = {}) => {
      setIsLoading(true);
      setError(null);

      // 로컬스토리지에서 factoryId 가져오기
      const factoryId = getStoredFactoryId();
      if (!factoryId) {
        setError('공장 정보가 없습니다.');
        setIsLoading(false);
        return { success: false, error: '공장 정보가 없습니다.' };
      }

      try {
        // eslint-disable-next-line camelcase
        const { product_id, ...otherFilters } = filters;
        const params = new URLSearchParams();
        Object.entries(otherFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null)
            params.append(key, String(value));
        });

        // product_id를 쿼리 파라미터로 추가
        // eslint-disable-next-line camelcase
        if (product_id) {
          params.append('product_id', String(product_id));
        }

        // factory_id 추가
        params.append('factory_id', factoryId.toString());

        const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/history?${params.toString()}`;

        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
        });
        const result = await res.json();
        if (res.ok) {
          setData(result);
          return { success: true, data: result };
        } else {
          setError(
            result.message || '제품 입출고 이력 상세 조회에 실패했습니다.'
          );
          return { success: false, error: result.message };
        }
      } catch {
        setError('서버 연결에 실패했습니다.');
        return { success: false, error: '서버 연결에 실패했습니다.' };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    data,
    listProductHistories,
    getProductHistory,
    createProductHistory,
  };
};

export default useProductHistory;
