import { useState, useCallback } from 'react';
import { ClientResponseModel } from '@/types/data-model';

interface GetClientDetailParamsModel {
  client_id: number;
  factory_id: number;
}

const useGetClientDetail = () => {
  const [clientDetail, setClientDetail] = useState<ClientResponseModel | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 거래처 상세 조회 함수
  const getClientDetail = useCallback(
    async (params: GetClientDetailParamsModel) => {
      setIsLoading(true);
      setError(null);
      setClientDetail(null);

      try {
        // 유효성 검사
        if (!params.client_id || !params.factory_id) {
          throw new Error('client_id와 factory_id가 필요합니다.');
        }
        if (!Number.isInteger(params.client_id) || params.client_id <= 0) {
          throw new Error('유효하지 않은 client_id입니다.');
        }
        if (!Number.isInteger(params.factory_id) || params.factory_id <= 0) {
          throw new Error('유효하지 않은 factory_id입니다.');
        }

        // 쿼리 파라미터 생성
        const queryParams = new URLSearchParams({
          factory_id: params.factory_id.toString(),
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/client/${params.client_id}?${queryParams}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (response.ok) {
          const result: ClientResponseModel = await response.json();
          setClientDetail(result);
          return { success: true, data: result };
        } else if (response.status === 404) {
          const errorMessage = '거래처를 찾을 수 없습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail || '거래처 상세 정보를 불러오는데 실패했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 데이터 초기화 함수
  const clearClientDetail = useCallback(() => {
    setClientDetail(null);
    setError(null);
  }, []);

  return {
    // 데이터
    clientDetail,
    isLoading,
    error,

    // API 호출 함수
    getClientDetail,

    // 유틸리티
    clearClientDetail,
    refetch: (params: GetClientDetailParamsModel) => getClientDetail(params),
  };
};

export default useGetClientDetail;
