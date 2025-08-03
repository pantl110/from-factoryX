import { useState } from 'react';
import {
  MaterialHistoryPriceResponseModel,
  MaterialHistoryPriceListResponseModel,
} from '@/types/data-model';

interface GetMaterialHistoryOptionModel {
  start_date?: string;
  end_date?: string;
  type?: '구매' | '소모';
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

// 특정 원자재의 히스토리를 조회 // 업체별 단가 비교
// 기간 설정이 없으면 전체 히스토리를, 기간 설정이 있으면 해당 기간의 히스토리를 조회
const useGetMaterialHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [histories, setHistories] =
    useState<MaterialHistoryPriceListResponseModel | null>(null);

  const getMaterialHistory = async (
    materialId: number,
    options?: GetMaterialHistoryOptionModel
  ) => {
    setIsLoading(true);
    setError(null);

    // 로컬스토리지에서 factoryId 가져오기
    const factoryId = getStoredFactoryId();
    if (!factoryId) {
      setError('공장 ID가 설정되지 않았습니다.');
      return { success: false, error: '공장 ID가 설정되지 않았습니다.' };
    }

    try {
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/history`;
      const params = new URLSearchParams();

      // factory_id를 query parameter로
      params.append('factory_id', factoryId.toString());
      // material_id를 query parameter로 추가
      params.append('material_id', materialId.toString());

      // 기간 필터 파라미터
      if (options?.start_date) {
        params.append('start_date', options.start_date);
      }
      if (options?.end_date) {
        params.append('end_date', options.end_date);
      }
      // 타입 필터 파라미터
      if (options?.type) {
        params.append('type', options.type);
      }
      // 페이지네이션 파라미터
      const page = options?.page || 1;
      const pageSize = options?.page_size || 5;

      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());

      // 최종 URL 구성
      const finalUrl = `${baseUrl}?${params.toString()}`;

      const response = await fetch(finalUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result: MaterialHistoryPriceListResponseModel =
          await response.json();

        // API 응답을 그대로 사용 (백엔드에서 올바른 구조로 보내줄 것으로 예상)
        const transformedData: MaterialHistoryPriceListResponseModel = {
          ...result,
          data:
            result.data?.map((item: MaterialHistoryPriceResponseModel) => ({
              ...item,
              type: item.type,
              client_name: item.client_name || '',
              unit_price: item.unit_price || 0,
              date: item.date || '',
            })) || [],
        };

        setHistories(transformedData);
        return { success: true, data: transformedData };
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

  return { getMaterialHistory, histories, isLoading, error };
};

export default useGetMaterialHistory;
