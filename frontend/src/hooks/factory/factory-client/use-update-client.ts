'use client';

import { useState, useCallback } from 'react';
import { ClientUpdateModel, ClientResponseModel } from '@/types/data-model';

// 공장 거래처 정보 수정
const useUpdateClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateClient = useCallback(async (data: ClientUpdateModel) => {
    setIsLoading(true);
    setError(null);

    try {
      // 유효성 검사
      if (!data.client_id || !data.factory_id) {
        throw new Error('client_id와 factory_id가 필요합니다.');
      }

      // 쿼리 파라미터 생성
      const queryParams = new URLSearchParams({
        factory_id: data.factory_id.toString(),
      });

      // body에서 client_id와 factory_id 제외하고 전송
      const {
        client_id: clientId,
        factory_id: _factoryId,
        ...updatePayload
      } = data;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/client/${clientId}?${queryParams}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (response.ok) {
        const result: ClientResponseModel = await response.json();
        return { success: true, data: result };
      } else if (response.status === 404) {
        const errorMessage = '거래처를 찾을 수 없습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '거래처 정보 수정에 실패했습니다.';
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
  }, []);

  return {
    updateClient,
    isLoading,
    error,
  };
};

export default useUpdateClient;
