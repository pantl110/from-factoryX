import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';
import { UndeliveredProductListResponseModel } from '@/types/data-model';

interface GetUndeliveredProductsModel {
  page?: number;
}

const useGetUndeliveredProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useFactoryStore();

  const getUndeliveredProducts = useCallback(async (
    params: GetUndeliveredProductsModel
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Zustand store에서 factoryId 가져오기
      if (!factoryId) {
        setError('Factory ID를 찾을 수 없습니다.');
        return { success: false, error: 'Factory ID를 찾을 수 없습니다.' };
      }

      const queryParams = new URLSearchParams();
      queryParams.append('factory_id', factoryId.toString());
      queryParams.append('page', (params.page || 1).toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/product/undelivered?${queryParams}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        const result: UndeliveredProductListResponseModel = await response.json();
        // 백엔드에서 페이지네이션 정보를 받아옴
        return { 
          success: true, 
          data: result
        };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '납품되지 않은 견적서 품목 조회에 실패했습니다.';
        setError(errorMessage);
        return { 
          success: false, 
          error: errorMessage, 
          data: {
            count: 0,
            totalCnt: 0,
            pageCnt: 0,
            curPage: params.page || 1,
            data: []
          } as UndeliveredProductListResponseModel
        };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { 
        success: false, 
        error: '서버 연결에 실패했습니다.', 
        data: {
          count: 0,
          totalCnt: 0,
          pageCnt: 0,
          curPage: params.page || 1,
          data: []
        } as UndeliveredProductListResponseModel
      };
    } finally {
      setIsLoading(false);
    }
  }, [factoryId]);

  return { getUndeliveredProducts, isLoading, error };
};

export default useGetUndeliveredProducts;
