import { useState } from 'react';
import { MaterialHistoryListResponseModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';

interface GetMaterialHistoryOptionModel {
  type?: 'purchase' | 'consumption';
  start_date?: string;
  end_date?: string;
  is_cash_receipt?: boolean;
  material_id?: number;
  material_name?: string;
  client_id?: number;
  page?: number;
  page_size?: number;
}

// 원자재 히스토리를 조회합니다. material_id가 제공되면 특정 원자재의 히스토리를, 제공되지 않으면 전체 원자재 히스토리를 조회합니다.
// 기간 설정이 없으면 전체 히스토리를, 기간 설정이 있으면 해당 기간의 히스토리를 조회합니다.
// client_id 필터가 추가되어 특정 거래처의 원자재 히스토리만 조회할 수 있습니다.
const useGetMaterialHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [histories, setHistories] =
    useState<MaterialHistoryListResponseModel | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const getMaterialHistory = async (
    options?: GetMaterialHistoryOptionModel
  ) => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      setError('공장 ID가 설정되지 않았습니다.');
      return { success: false, error: '공장 ID가 설정되지 않았습니다.' };
    }

    try {
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/history`;
      const params = new URLSearchParams();

      // factory_id를 query parameter로
      params.append('factory_id', factoryId.toString());

      // material_id를 query parameter로 추가 (옵션)
      if (options?.material_id) {
        params.append('material_id', options.material_id.toString());
      }

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

      // 그 외 파라미터들
      if (options?.is_cash_receipt !== undefined) {
        params.append('is_cash_receipt', options.is_cash_receipt.toString());
      }
      if (options?.material_name) {
        params.append('material_name', options.material_name);
      }
      if (options?.client_id) {
        params.append('client_id', options.client_id.toString());
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

  return { getMaterialHistory, histories, isLoading, error };
};

export default useGetMaterialHistory;
