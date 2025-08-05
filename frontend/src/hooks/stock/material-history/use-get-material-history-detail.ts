import { useState, useCallback } from 'react';
import { MaterialHistoryStockListResponseModel } from '@/types/data-model';

interface GetMaterialHistoryDetailOptionModel {
  start_date?: string;
  end_date?: string;
  page?: number;
  size?: number;
}

// 특정 원자재의 이력 상세 조회
// material_id, 기간 필터로 처리일자, 상태, 수량, 현재 재고, 매입계산서/현금영수증 연결 유무 반환
const useGetMaterialHistoryDetail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [histories, setHistories] =
    useState<MaterialHistoryStockListResponseModel | null>(null);

  const getMaterialHistoryDetail = useCallback(
    async (
      materialId: number,
      options?: GetMaterialHistoryDetailOptionModel
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        // material_id 파라미터 추가
        params.append('material_id', materialId.toString());

        // 기간 필터 파라미터
        if (options?.start_date) {
          params.append('start_date', options.start_date);
        }
        if (options?.end_date) {
          params.append('end_date', options.end_date);
        }

        // 페이지네이션 파라미터
        if (options?.page !== undefined) {
          params.append('page', options.page.toString());
        }
        if (options?.size !== undefined) {
          params.append('size', options.size.toString());
        }

        // URL 구성
        const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/history/detail`;
        const queryString = params.toString();
        const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result: MaterialHistoryStockListResponseModel =
            await response.json();
          setHistories(result);
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail || '원자재 이력 상세 조회에 실패했습니다.';
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
    },
    []
  );

  return {
    getMaterialHistoryDetail,
    histories,
    isLoading,
    error,
  };
};

export default useGetMaterialHistoryDetail;
