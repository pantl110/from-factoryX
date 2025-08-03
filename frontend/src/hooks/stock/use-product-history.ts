import {
  ProductHistoryListResponseModel,
  ProductHistoryModel,
  ProductHistoryResponseModel,
} from '@/types/data-model';
import { useState, useCallback } from 'react';

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
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/history`,
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
          // eslint-disable-next-line camelcase
          params.append('product_id', String(product_id));
        }
        
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
          // eslint-disable-next-line camelcase
          params.append('product_id', String(product_id));
        }
        
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
