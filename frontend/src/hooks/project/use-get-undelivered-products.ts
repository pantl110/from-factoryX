import { useState } from 'react';

interface UndeliveredProductModel {
  company_name: string;
  product_name: string;
  delivery_date: string | null;
  project_id: number;
}

interface GetUndeliveredProductsModel {
  page?: number;
}

const useGetUndeliveredProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUndeliveredProducts = async (
    params: GetUndeliveredProductsModel
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // localStorage에서 factoryId 가져오기
      const factoryId = localStorage.getItem('factoryId');
      if (!factoryId) {
        setError('Factory ID를 찾을 수 없습니다.');
        return { success: false, error: 'Factory ID를 찾을 수 없습니다.' };
      }

      const queryParams = new URLSearchParams();
      queryParams.append('factory_id', factoryId);
      queryParams.append('page', (params.page || 1).toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/quotation/product/undelivered?${queryParams}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        const result: UndeliveredProductModel[] = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '납품되지 않은 견적서 품목 조회에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { getUndeliveredProducts, isLoading, error };
};

export default useGetUndeliveredProducts;
