import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  CreateMaterialProductModel,
  MaterialProductConnectionResponseModel,
  MaterialProductConnectionModel,
  ProductMaterialConnectionModel,
} from '@/types/data-model';
import useMemberStore from '@/store/member-store';

type ConnectionModelType =
  | MaterialProductConnectionModel
  | ProductMaterialConnectionModel;

// 원자재와 제품을 연결하여 BOM(Bill of Materials)을 생성합니다.
// type에 따라 원자재 기준 또는 제품 기준으로 연결할 수 있습니다.
const useMaterialProduct = () => {
  const tErrors = useTranslations('common.errors');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [data, setData] = useState<
    MaterialProductConnectionResponseModel | ConnectionModelType[] | null
  >(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const fail = useCallback(
    (key: string) => {
      const message = tErrors(key);
      setError(message);
      return { success: false, error: message };
    },
    [tErrors]
  );

  const factoryGuard = useCallback(() => {
    setError(tErrors('factoryInfoMissing'));
    setIsLoading(false);
    return { success: false, error: tErrors('factoryInfoMissingShort') };
  }, [tErrors]);

  // 연결 생성
  const createMaterialProduct = async (payload: CreateMaterialProductModel) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    if (!factoryId) return factoryGuard();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/materialproduct?factory_id=${factoryId}`,
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
        setError(result.detail || tErrors('connectionCreateFailed'));
        return { success: false, error: result.detail };
      }
    } catch {
      return fail('serverConnectionFailed');
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

      if (!factoryId) return factoryGuard();

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/materialproduct/${targetId}?type=${type}&factory_id=${factoryId}`,
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
          setError(result.detail || tErrors('connectionReadFailed'));
          return { success: false, error: result.detail };
        }
      } catch {
        return fail('serverConnectionFailed');
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId, tErrors, fail, factoryGuard]
  );

  // 연결 삭제
  const deleteMaterialProductConnection = async (connectionId: number) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    if (!factoryId) return factoryGuard();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/materialproduct/connection/${connectionId}?factory_id=${factoryId}`,
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
        setError(result.detail || tErrors('connectionDeleteFailed'));
        return { success: false, error: result.detail };
      }
    } catch {
      return fail('serverConnectionFailed');
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

    if (!factoryId) return factoryGuard();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/materialproduct/connection/${connectionId}?factory_id=${factoryId}`,
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
        setError(result.detail || tErrors('connectionUpdateFailed'));
        return { success: false, error: result.detail };
      }
    } catch {
      return fail('serverConnectionFailed');
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
