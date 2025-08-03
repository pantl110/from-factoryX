import { useState, useCallback } from 'react';
import {
  ProductResponseModel,
  ProductListResponseModel,
  PaginationModel,
} from '@/types/data-model';

interface GetProductListModel {
  q?: string;
  page?: number;
  page_size?: number;
}

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

const useGetProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductResponseModel | null>(null);
  const [productList, setProductList] = useState<ProductResponseModel[]>([]);
  const [pagination, setPagination] = useState<PaginationModel | null>(null);

  // 제품 목록 조회 (q, page, page_size)
  const getProductList = useCallback(
    async (params: GetProductListModel = {}) => {
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
    []
  );

  // 제품 상세 조회 (product_id)
  const getProductDetail = useCallback(async (productId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/${productId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

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
  }, []);

  return {
    getProductList,
    getProductDetail,
    product,
    productList,
    pagination,
    isLoading,
    error,
  };
};

export default useGetProduct;
