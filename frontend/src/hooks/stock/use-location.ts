import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  LocationModel,
  LocationListResponseModel,
  UpdateLocationModel,
} from '@/types/data-model';
import useMemberStore from '@/store/member-store';

const useLocation = () => {
  const tErrors = useTranslations('common.errors');
  const factoryId = useMemberStore((state) => state.factoryId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<
    LocationListResponseModel | LocationModel | null
  >(null);

  // 창고 위치 생성
  // material id/product id에 창고 위치를 생성
  const createLocation = async (payload: LocationModel) => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      setError(tErrors('factoryIdRequired'));
      return { success: false, error: tErrors('factoryIdRequired') };
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/location?factory_id=${factoryId}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const result = await res.json();
      if (res.ok) {
        setData(result);
        return { success: true, data: result };
      } else {
        setError(result.detail || tErrors('locationCreateFailed'));
        return { success: false, error: result.detail };
      }
    } catch {
      setError(tErrors('serverConnectionFailed'));
      return { success: false, error: tErrors('serverConnectionFailed') };
    } finally {
      setIsLoading(false);
    }
  };

  // 창고 위치 목록 조회
  // material id/product id에 창고 위치 목록 조회
  const listLocations = useCallback(
    async (type: 'material' | 'product', id: number) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        setError(tErrors('factoryIdRequired'));
        return { success: false, error: tErrors('factoryIdRequired') };
      }

      try {
        const params = new URLSearchParams({
          type,
          id: String(id),
          factory_id: String(factoryId),
        });
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/location?${params.toString()}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );
        // 연결된 장소가 아직 없을 때 빈배열 반환
        if (res.status === 404) {
          setData({ locations: [] });
          return { success: true, data: { locations: [] } };
        }
        const result = await res.json();
        if (res.ok) {
          setData(result);
          return { success: true, data: result };
        } else {
          setError(result.detail || tErrors('locationReadFailed'));
          return { success: false, error: result.detail };
        }
      } catch {
        setError(tErrors('serverConnectionFailed'));
        return { success: false, error: tErrors('serverConnectionFailed') };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId, tErrors]
  );

  // 창고 위치 수정
  const updateLocation = async (
    locationId: number,
    payload: UpdateLocationModel
  ) => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      setError(tErrors('factoryIdRequired'));
      return { success: false, error: tErrors('factoryIdRequired') };
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/location/${locationId}?factory_id=${factoryId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const result = await res.json();
      if (res.ok) {
        setData(result);
        return { success: true, data: result };
      } else {
        setError(result.detail || tErrors('locationUpdateFailed'));
        return { success: false, error: result.detail };
      }
    } catch {
      setError(tErrors('serverConnectionFailed'));
      return { success: false, error: tErrors('serverConnectionFailed') };
    } finally {
      setIsLoading(false);
    }
  };

  // 창고 위치 삭제
  const deleteLocation = async (
    locationId: number,
    type: 'material' | 'product'
  ) => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      setError(tErrors('factoryIdRequired'));
      return { success: false, error: tErrors('factoryIdRequired') };
    }

    try {
      const params = new URLSearchParams({
        type,
        factory_id: String(factoryId),
      });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/location/${locationId}?${params.toString()}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      const result = await res.json();
      if (res.ok) {
        setData(result);
        return { success: true, data: result };
      } else {
        setError(result.detail || tErrors('locationDeleteFailed'));
        return { success: false, error: result.detail };
      }
    } catch {
      setError(tErrors('serverConnectionFailed'));
      return { success: false, error: tErrors('serverConnectionFailed') };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createLocation,
    listLocations,
    updateLocation,
    deleteLocation,
    isLoading,
    error,
    data,
  };
};

export default useLocation;
