import { useState, useCallback } from 'react';
import {
  CreateMaterialProductModel,
  MaterialProductConnectionResponseModel,
} from '@/types/data-model';

// 원자재와 제품을 연결하여 BOM(Bill of Materials)을 생성합니다.
// type에 따라 원자재 기준 또는 제품 기준으로 연결할 수 있습니다.
const useMaterialProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [data, setData] =
    useState<MaterialProductConnectionResponseModel | null>(null);

  // 연결 생성
  const createMaterialProduct = async (payload: CreateMaterialProductModel) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/materialproduct`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (response.ok) {
        setData(result);
        setIsSuccess(true);
        return { success: true, data: result };
      } else {
        setError(result.detail || '연결 생성에 실패했습니다.');
        return { success: false, error: result.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  // 연결 조회
  // type이 'material'이면 해당 원자재가 사용되는 제품들을, 'product'이면 해당 제품에 필요한 원자재들을 조회
  const getMaterialProductConnections = useCallback(
    async (targetId: number, type: 'material' | 'product') => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/materialproduct/${targetId}?type=${type}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );
        const result = await response.json();
        if (response.ok) {
          setData(result);
          setIsSuccess(true);
          return { success: true, data: result };
        } else {
          setError(result.detail || '연결 조회에 실패했습니다.');
          return { success: false, error: result.detail };
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

  // 연결 삭제
  const deleteMaterialProductConnection = async (connectionId: number) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/materialproduct/connection/${connectionId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      const result = await response.json();
      if (response.ok) {
        setData(result);
        setIsSuccess(true);
        return { success: true, data: result };
      } else {
        setError(result.detail || '연결 삭제에 실패했습니다.');
        return { success: false, error: result.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  // 데이터 초기화
  const resetData = useCallback(() => {
    setData(null);
    setError(null);
    setIsSuccess(false);
  }, []);

  // 연결 수정
  const updateMaterialProductConnection = async (
    connectionId: number,
    quantity: number
  ) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/materialproduct/connection/${connectionId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        }
      );
      const result = await response.json();
      if (response.ok) {
        setData(result);
        setIsSuccess(true);
        return { success: true, data: result };
      } else {
        setError(result.detail || '연결 수정에 실패했습니다.');
        return { success: false, error: result.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    isSuccess,
    data,
    createMaterialProduct,
    getMaterialProductConnections,
    deleteMaterialProductConnection,
    updateMaterialProductConnection,
    resetData,
  };
};

export default useMaterialProduct;
