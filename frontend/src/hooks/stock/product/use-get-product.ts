'use client';

import { useState, useCallback } from 'react';
import {
  ProductResponseModel,
  ProductListResponseModel,
  PaginationModel,
} from '@/types/data-model';
import useMemberStore from '@/store/member-store';

interface GetProductListModel {
  q?: string;
  page?: number;
  page_size?: number;
}

const useGetProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductResponseModel | null>(null);
  const [productList, setProductList] = useState<ProductResponseModel[]>([]);
  const [pagination, setPagination] = useState<PaginationModel | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  // 제품 목록 조회 (q, page, page_size)
  const getProductList = useCallback(
    async (params: GetProductListModel = {}) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        // factoryId가 없으면 빈 데이터를 반환 (일관된 PaginationModel 형태 유지)
        const emptyResult: ProductListResponseModel = {
          data: [],
          count: 0,
          totalCnt: 0,
          pageCnt: 0,
          curPage: 1,
          nextPage: null,
          previousPage: null,
        };
        setProductList([]);
        setPagination(null);
        setIsLoading(false);
        return { success: true, data: emptyResult };
      }

      try {
        const queryParams = new URLSearchParams();
        queryParams.append('factory_id', factoryId.toString());
        if (params.q) queryParams.append('q', params.q);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.page_size)
          queryParams.append('page_size', params.page_size.toString());
        const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product?${queryParams}`;
        const headers = {
          'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers,
        });

        if (response.ok) {
          const result: ProductListResponseModel = await response.json();
          const products = result.data || [];
          setProductList(products);
          // result는 ProductListResponseModel이므로 PaginationModel로 타입 단언
          setPagination(result as PaginationModel);
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          setError(errorData.detail || '제품 목록을 불러오지 못했습니다.');
          return { success: false, error: errorData.detail };
        }
      } catch {
        setError('서버 연결에 실패했습니다.');
        return { success: false, error: '서버 연결에 실패했습니다.' };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  // 제품 상세 조회 (product_id)
  const getProductDetail = useCallback(
    async (productId: number) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        // factoryId가 없으면 빈 데이터를 반환
        setProduct(null);
        setIsLoading(false);
        return { success: true, data: null };
      }

      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/${productId}?factory_id=${factoryId}`;
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result: ProductResponseModel = await response.json();
          setProduct(result);
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          setError(errorData.detail || '제품 상세 정보를 불러오지 못했습니다.');
          return { success: false, error: errorData.detail };
        }
      } catch {
        setError('서버 연결에 실패했습니다.');
        return { success: false, error: '서버 연결에 실패했습니다.' };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  // 전체 제품 목록을 한 번에 가져오는 함수
  const getAllProductList = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      setError('공장 ID가 설정되지 않았습니다.');
      return { success: false, error: '공장 ID가 설정되지 않았습니다.' };
    }

    try {
      // 먼저 전체 개수를 조회
      const countResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product?factory_id=${factoryId}&page=1&page_size=1`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!countResponse.ok) {
        const errorData = await countResponse.json();
        const errorMessage =
          errorData.detail || '제품 목록을 불러오는데 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const countResult = await countResponse.json();
      const totalCount = countResult.totalCnt || 0;

      if (totalCount === 0) {
        setProductList([]);
        setPagination({
          count: 0,
          totalCnt: 0,
          pageCnt: 1,
          curPage: 1,
          nextPage: null,
          previousPage: null,
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
      const allResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product?factory_id=${factoryId}&page=1&page_size=${totalCount}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (allResponse.ok) {
        const result: ProductListResponseModel = await allResponse.json();
        setProductList(result.data || []);
        setPagination(result as PaginationModel);
        return { success: true, data: result };
      } else {
        const errorData = await allResponse.json();
        const errorMessage =
          errorData.detail || '제품 목록을 불러오는데 실패했습니다.';
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
  }, [factoryId]);

  return {
    getProductList,
    getProductDetail,
    getAllProductList,
    product,
    productList,
    pagination,
    isLoading,
    error,
  };
};

export default useGetProduct;
