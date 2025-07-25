import { useState } from 'react';
import { MaterialHistoryListResponseModel } from '@/types/data-model';

interface GetMaterialHistoryModel {
  months?: number;
  days?: number;
  page?: number;
  size?: number;
}

// 특정 원자재의 히스토리를 조회
// // 기간 설정이 없으면 전체 히스토리를, 기간 설정이 있으면 해당 기간의 히스토리를 조회
const useGetMaterialHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [histories, setHistories] =
    useState<MaterialHistoryListResponseModel | null>(null);

  const getMaterialHistory = async (
    materialId: number,
    options?: GetMaterialHistoryModel
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // 기간 필터 파라미터
      if (options?.months !== undefined) {
        params.append('months', options.months.toString());
      }
      if (options?.days !== undefined) {
        params.append('days', options.days.toString());
      }

      // 페이지네이션 파라미터
      if (options?.page !== undefined) {
        params.append('page', options.page.toString());
      }
      if (options?.size !== undefined) {
        params.append('size', options.size.toString());
      }

      // URL 구성
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/history/${materialId}`;
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
        const result: MaterialHistoryListResponseModel = await response.json();
        setHistories(result);
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '원자재 히스토리 조회에 실패했습니다.';
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
  };

  return {
    getMaterialHistory,
    histories,
    isLoading,
    error,
  };
};

export default useGetMaterialHistory;
