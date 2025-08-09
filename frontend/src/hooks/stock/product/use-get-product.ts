import { useState, useCallback } from 'react';
import {
  ProductResponseModel,
  ProductListResponseModel,
  PaginationModel,
} from '@/types/data-model';
import useFactoryStore from '@/store/factory-store';

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
  const [allProductCodes, setAllProductCodes] = useState<string[]>([]);
  const factoryId = useFactoryStore((state) => state.factoryId);

  // 제품 목록 조회 (q, page, page_size)
  const getProductList = useCallback(
    async (params: GetProductListModel = {}) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        // factoryId가 없으면 빈 데이터를 반환
        setProductList([]);
        setPagination(null);
        setIsLoading(false);
        return { success: true, data: { data: [], count: 0 } };
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
          setError(errorData.detail || '품목 목록을 불러오지 못했습니다.');
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
  const getProductDetail = useCallback(async (productId: number) => {
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
        setError(errorData.detail || '품목 상세 정보를 불러오지 못했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  }, [factoryId]);

  // 모든 품목 코드 조회
  const getAllProductCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      // factoryId가 없으면 빈 배열을 반환
      setAllProductCodes([]);
      setIsLoading(false);
      return { success: true, data: [] };
    }

    try {
      // 1. 먼저 첫 번째 요청으로 total 개수 확인
      const initialQueryParams = new URLSearchParams();
      initialQueryParams.append('factory_id', factoryId.toString());
      initialQueryParams.append('page', '1');
      initialQueryParams.append('page_size', '1'); // 최소한의 데이터만 가져와서 total 확인

      const initialUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product?${initialQueryParams}`;
      const initialResponse = await fetch(initialUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!initialResponse.ok) {
        const errorData = await initialResponse.json();
        setError(errorData.detail || '품목 코드 목록을 불러오지 못했습니다.');
        return { success: false, error: errorData.detail };
      }

      const initialResult: ProductListResponseModel =
        await initialResponse.json();
      const total = initialResult.totalCnt || 0;

      if (total === 0) {
        setAllProductCodes([]);
        return { success: true, data: [] };
      }

      // 2. total 개수만큼 한 번에 가져오기
      const queryParams = new URLSearchParams();
      queryParams.append('factory_id', factoryId.toString());
      queryParams.append('page', '1');
      queryParams.append('page_size', total.toString());

      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product?${queryParams}`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result: ProductListResponseModel = await response.json();
        const products = result.data || [];
        const codes = products.map((product) => product.code).filter(Boolean);
        setAllProductCodes(codes);
        return { success: true, data: codes };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '품목 코드 목록을 불러오지 못했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  }, [factoryId]);

  return {
    getProductList,
    getProductDetail,
    getAllProductCodes,
    product,
    productList,
    pagination,
    allProductCodes,
    isLoading,
    error,
  };
};

export default useGetProduct;
