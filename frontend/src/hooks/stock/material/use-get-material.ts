'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MaterialListResponseModel,
  MaterialResponseModel,
  PaginationModel,
} from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import { MaterialFilterModel } from './use-material-mutations';

const EMPTY_PAGINATION: MaterialListResponseModel = {
  data: [],
  count: 0,
  totalCnt: 0,
  pageCnt: 0,
  curPage: 1,
  nextPage: null,
  previousPage: null,
};

const MATERIAL_LIST_QUERY_KEY = (
  factoryId: number | null,
  filters: MaterialFilterModel | null
) => ['material-list', factoryId ?? 'no-factory', filters];

const MATERIAL_DETAIL_QUERY_KEY = (factoryId: number, materialId: number) => [
  'material-detail',
  factoryId,
  materialId,
];

const ALL_MATERIALS_QUERY_KEY = (factoryId: number) => [
  'material-list',
  factoryId,
  'all',
];

const buildListParams = (
  factoryId: number,
  filters: MaterialFilterModel = {}
) => {
  const params = new URLSearchParams();
  params.append('factory_id', factoryId.toString());
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.page_size)
    params.append('page_size', filters.page_size.toString());
  if (filters.q) params.append('q', filters.q);
  if (filters.order) params.append('order', filters.order);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.material_id)
    params.append('material_id', filters.material_id.toString());
  if (filters.status) params.append('status', filters.status);
  return params;
};

const fetchMaterialList = async (
  factoryId: number,
  filters: MaterialFilterModel = {}
) => {
  const params = buildListParams(factoryId, filters);
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material?${params.toString()}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || '원자재 목록을 불러오지 못했습니다.');
  }

  const result: MaterialListResponseModel = await response.json();
  return result;
};

const fetchMaterialDetail = async (factoryId: number, materialId: number) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/${materialId}?factory_id=${factoryId}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || '원자재 상세 정보를 불러오지 못했습니다.'
    );
  }

  const result: MaterialResponseModel = await response.json();
  return result;
};

const fetchAllMaterials = async (factoryId: number) => {
  // 1) minimal request to get total count
  const firstPageResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material?${new URLSearchParams(
      {
        page: '1',
        page_size: '1',
        factory_id: factoryId.toString(),
      }
    ).toString()}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  if (!firstPageResponse.ok) {
    const errorData = await firstPageResponse.json().catch(() => null);
    throw new Error(errorData?.detail || '원자재 목록을 불러오지 못했습니다.');
  }

  const firstPageResult: MaterialListResponseModel =
    await firstPageResponse.json();
  const totalCnt = firstPageResult.totalCnt || 0;

  if (totalCnt === 0) {
    return [];
  }

  const allParams = new URLSearchParams({
    page: '1',
    page_size: totalCnt.toString(),
    factory_id: factoryId.toString(),
  });
  const allDataResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material?${allParams.toString()}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  if (!allDataResponse.ok) {
    const errorData = await allDataResponse.json().catch(() => null);
    throw new Error(errorData?.detail || '원자재 목록을 불러오지 못했습니다.');
  }

  const allDataResult: MaterialListResponseModel = await allDataResponse.json();
  return allDataResult.data || [];
};

const useGetMaterial = () => {
  const queryClient = useQueryClient();
  const factoryId = useMemberStore((state) => state.factoryId);

  const [material, setMaterial] = useState<MaterialResponseModel | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] =
    useState<MaterialFilterModel | null>(null);

  const materialListQuery = useQuery<MaterialListResponseModel, Error>({
    queryKey: MATERIAL_LIST_QUERY_KEY(factoryId ?? null, activeFilters),
    queryFn: async () => {
      if (!factoryId || !activeFilters) {
        return EMPTY_PAGINATION;
      }
      return fetchMaterialList(factoryId, activeFilters);
    },
    enabled: !!factoryId && activeFilters !== null,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  const getMaterialList = useCallback(
    async (filters: MaterialFilterModel = {}) => {
      if (!factoryId) {
        setActiveFilters(filters);
        return { success: true, data: EMPTY_PAGINATION };
      }

      try {
        setManualError(null);
        setActiveFilters(filters);

        const data = await queryClient.fetchQuery({
          queryKey: MATERIAL_LIST_QUERY_KEY(factoryId, filters),
          queryFn: () => fetchMaterialList(factoryId, filters),
          staleTime: 0,
        });

        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : '원자재 목록을 불러오지 못했습니다.';
        setManualError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [factoryId, queryClient]
  );

  const getMaterialDetail = useCallback(
    async (materialId: number) => {
      if (!factoryId) {
        setMaterial(null);
        return { success: true, data: null };
      }

      try {
        setManualError(null);
        const result = await queryClient.fetchQuery({
          queryKey: MATERIAL_DETAIL_QUERY_KEY(factoryId, materialId),
          queryFn: () => fetchMaterialDetail(factoryId, materialId),
          staleTime: 1000 * 30,
        });
        setMaterial(result);
        return { success: true, data: result };
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : '원자재 상세 정보를 불러오지 못했습니다.';
        setManualError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [factoryId, queryClient]
  );

  const getAllMaterials = useCallback(async () => {
    if (!factoryId) {
      return { success: true, data: [] };
    }

    try {
      setManualError(null);
      const data = await queryClient.fetchQuery({
        queryKey: ALL_MATERIALS_QUERY_KEY(factoryId),
        queryFn: () => fetchAllMaterials(factoryId),
        staleTime: 1000 * 60,
      });

      return { success: true, data };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : '원자재 목록을 불러오지 못했습니다.';
      setManualError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [factoryId, queryClient]);

  const materialListData = materialListQuery.data;

  const materialList = useMemo(() => {
    if (!materialListData) {
      return [];
    }
    return materialListData.data;
  }, [materialListData]);

  const pagination: PaginationModel | null = useMemo(() => {
    if (!materialListData) {
      return null;
    }
    return materialListData;
  }, [materialListData]);

  const errorMessage =
    manualError ||
    (materialListQuery.error instanceof Error
      ? materialListQuery.error.message
      : null);

  return {
    material,
    materialList,
    pagination,
    isLoading: materialListQuery.isFetching,
    error: errorMessage,
    getMaterialList,
    getMaterialDetail,
    getAllMaterials,
  };
};

export default useGetMaterial;
