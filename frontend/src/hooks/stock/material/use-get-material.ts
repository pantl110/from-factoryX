import { useState, useCallback } from 'react';
import {
  MaterialListResponseModel,
  MaterialResponseModel,
  PaginationModel,
} from '@/types/data-model';
import useFactoryStore from '@/store/factory-store';

interface MaterialFilterModel {
  page?: number;
  page_size?: number;
  q?: string;
  order?: 'asc' | 'desc';
  limit?: number;
}

const useGetMaterial = () => {
  const factoryId = useFactoryStore(
    (state: { factoryId: number | null }) => state.factoryId
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [material, setMaterial] = useState<MaterialResponseModel | null>(null);
  const [materialList, setMaterialList] = useState<MaterialResponseModel[]>([]);
  const [pagination, setPagination] = useState<PaginationModel | null>(null);

  // 원자재 목록 조회
  const getMaterialList = useCallback(async (filters: MaterialFilterModel = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!factoryId) {
        setError('공장 정보가 없습니다.');
        setIsLoading(false);
        return { success: false, error: '공장 정보가 없습니다.' };
      }
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size)
        params.append('page_size', filters.page_size.toString());
      if (filters.q) params.append('q', filters.q);
      if (filters.order) params.append('order', filters.order);
      if (filters.limit) params.append('limit', filters.limit.toString());
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/factory/${factoryId}?${params}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      if (response.ok) {
        const result: MaterialListResponseModel = await response.json();
        setMaterialList(result.data || []);
        setPagination(result);
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '원자재 목록을 불러오지 못했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  }, [factoryId]);

  // 원자재 상세 조회
  const getMaterialDetail = useCallback(async (materialId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/${materialId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      if (response.ok) {
        const result: MaterialResponseModel = await response.json();
        setMaterial(result);
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '원자재 상세 정보를 불러오지 못했습니다.');
        return { success: false, error: errorData.detail };
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
      return { success: false, error: '서버 연결에 실패했습니다.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getMaterialList,
    getMaterialDetail,
    material,
    materialList,
    pagination,
    isLoading,
    error,
  };
};

export default useGetMaterial;
