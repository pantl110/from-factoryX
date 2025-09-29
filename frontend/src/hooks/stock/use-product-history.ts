import {
  ProductHistoryListResponseModel,
  ProductHistoryResponseModel,
} from '@/types/data-model';
import { useState, useCallback } from 'react';
import useMemberStore from '@/store/member-store';
import axios from 'axios';

export interface ProductHistoryFilterModel {
  product_id?: number | null; // 제품 ID (nullable 허용)
  project_id?: number; // 프로젝트 ID (선택)
  page?: number; // 페이지 번호
  page_size?: number; // 페이지 크기
  is_canceled?: boolean; // 취소 여부
}

const useProductHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<
    ProductHistoryResponseModel | ProductHistoryListResponseModel | null
  >(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  // List product histories (paginated)제품 입출고 이력 목록 조회
  const listProductHistories = useCallback(
    async (filters: ProductHistoryFilterModel = {}) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        setError('공장 정보가 없습니다.');
        setIsLoading(false);
        return { success: false, error: '공장 정보가 없습니다.' };
      }

      try {
        const {
          page,
          page_size: pageSize,
          product_id: productIdParam,
          project_id: projectIdParam,
          is_canceled: isCanceledParam,
        } = filters as Record<string, unknown> as {
          page?: number;
          page_size?: number;
          product_id?: number | null;
          project_id?: number;
          is_canceled?: boolean;
        };

        const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/history`;
        const res = await axios.get(url, {
          params: {
            factory_id: factoryId,
            product_id: productIdParam ?? undefined,
            project_id: projectIdParam,
            is_canceled: isCanceledParam,
            page,
            page_size: pageSize,
          },
          withCredentials: true,
        });
        const result = res.data;

        setData(result);
        return { success: true, data: result };
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { data?: { message?: string; detail?: string } };
        };
        const message =
          axiosErr?.response?.data?.message ||
          axiosErr?.response?.data?.detail ||
          '제품 입출고 이력 목록 조회에 실패했습니다.';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  // Get single product history // 제품 입출고 이력 상세 조회
  // const getProductHistory = useCallback(
  //   async (filters: ProductHistoryFilterModel = {}) => {
  //     setIsLoading(true);
  //     setError(null);
  //
  //     if (!factoryId) {
  //       setError('공장 정보가 없습니다.');
  //       setIsLoading(false);
  //       return { success: false, error: '공장 정보가 없습니다.' };
  //     }
  //
  //     try {
  //       const { product_id, project_id, page, page_size } = filters;
  //       const params = new URLSearchParams();
  //       if (page !== undefined) params.append('page', String(page));
  //       if (page_size !== undefined) params.append('page_size', String(page_size));
  //       if (product_id !== undefined && product_id !== null)
  //         params.append('product_id', String(product_id));
  //       if (project_id !== undefined) params.append('project_id', String(project_id));
  //       params.append('factory_id', factoryId.toString());
  //
  //       const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/history?${params.toString()}`;
  //
  //       const res = await fetch(url, {
  //         method: 'GET',
  //         credentials: 'include',
  //       });
  //       const result = await res.json();
  //       if (res.ok) {
  //         setData(result);
  //         return { success: true, data: result };
  //       } else {
  //         setError(
  //           result.message || '제품 입출고 이력 상세 조회에 실패했습니다.'
  //         );
  //         return { success: false, error: result.message };
  //       }
  //     } catch {
  //       setError('서버 연결에 실패했습니다.');
  //       return { success: false, error: '서버 연결에 실패했습니다.' };
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   },
  //   [factoryId]
  // );

  return {
    isLoading,
    error,
    data,
    listProductHistories,
    // getProductHistory,
    // createProductHistory,
  };
};

export default useProductHistory;
