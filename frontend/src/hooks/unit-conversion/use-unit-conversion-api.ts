'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import {
  UnitConversionListResponseModel,
  UnitConversionModel,
} from '@/types/data-model';
import axios from 'axios';

export interface UnitConversionCreatePayloadModel {
  // backend schema: UnitConversionCreateSchema
  // id 가 있으면 수정, 없으면 생성 동작
  id?: number | null;
  factory_id: number;
  material_id?: number | null;
  product_id?: number | null;
  from_unit?: string | null;
  to_unit?: string | null;
  // 변환식 왼쪽/오른쪽 숫자
  from_quantity?: number;
  to_quantity?: number;
  // 백엔드에서 conversion_rate 로도 계산하지만, 함께 전송
  conversion_rate?: number;
}

type HttpMethodType = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type UnitConversionEndpointType =
  | 'list'
  | 'create'
  | 'update'
  | 'delete'
  | 'by-material'
  | 'by-product';

interface CallOptionsModel {
  method?: HttpMethodType;
  body?: unknown;
  // Will be appended to URL as search params
  queryParams?: Record<string, string | number | boolean | null | undefined>;
  // Path params
  unit_conversion_id?: number;
  material_id?: number;
  product_id?: number;
}

interface ApiResponseModel<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const useUnitConversionApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useMemberStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  const call = useCallback(
    async <T = unknown>(
      endpoint: UnitConversionEndpointType,
      options: CallOptionsModel = {}
    ): Promise<ApiResponseModel<T>> => {
      // cancel previous
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          return {
            success: false,
            error:
              '공장 정보가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.',
          };
        }

        const { method = 'GET', body, queryParams = {} } = options;

        // Build URL
        let url = `${API_BASE}/v2/unit-conversion`;
        if (endpoint === 'update' || endpoint === 'delete') {
          if (!options.unit_conversion_id)
            throw new Error('unit_conversion_id가 필요합니다.');
          url += `/${options.unit_conversion_id}`;
        } else if (endpoint === 'by-material') {
          if (!options.material_id)
            throw new Error('material_id가 필요합니다.');
          url += `/material/${options.material_id}`;
        } else if (endpoint === 'by-product') {
          if (!options.product_id) throw new Error('product_id가 필요합니다.');
          url += `/product/${options.product_id}`;
        } else if (endpoint === 'create' || endpoint === 'list') {
          // keep base
        }

        // Ensure factory_id in query string for GET/DELETE and list/detail
        const params: Record<
          string,
          string | number | boolean | null | undefined
        > = {
          ...queryParams,
          factory_id: queryParams.factory_id ?? factoryId,
        };

        const axiosConfig = {
          method,
          url,
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
          signal,
          params,
          data: body,
        } as const;

        const resp = await axios.request<T>(axiosConfig);

        if (signal.aborted)
          return { success: false, error: '요청이 취소되었습니다.' };

        // axios throws on non-2xx, so reaching here means success
        // 204 No Content
        if (resp.status === 204)
          return { success: true } as ApiResponseModel<T>;

        return { success: true, data: resp.data };
      } catch (err) {
        // 요청 취소 처리
        if (
          (axios.isCancel && axios.isCancel(err)) ||
          (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') ||
          (err instanceof Error && err.name === 'AbortError')
        ) {
          return { success: false, error: '요청이 취소되었습니다.' };
        }
        let msg = '알 수 없는 오류가 발생했습니다.';
        if (axios.isAxiosError(err)) {
          const data = err.response?.data as unknown;
          if (data && typeof data === 'object') {
            const hasDetail = 'detail' in (data as Record<string, unknown>);
            const hasMessage = 'message' in (data as Record<string, unknown>);
            const maybeDetail = hasDetail
              ? (data as { detail?: unknown }).detail
              : undefined;
            const maybeMessage = hasMessage
              ? (data as { message?: unknown }).message
              : undefined;
            msg =
              (typeof maybeDetail === 'string' && maybeDetail) ||
              (typeof maybeMessage === 'string' && maybeMessage) ||
              err.message ||
              'API 요청에 실패했습니다.';
          } else {
            msg = err.message || 'API 요청에 실패했습니다.';
          }
        } else if (err instanceof Error) {
          msg = err.message;
        }
        setError(msg);
        return { success: false, error: msg };
      } finally {
        if (!abortControllerRef.current?.signal.aborted) setIsLoading(false);
      }
    },
    [factoryId]
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Helper methods with types
  const create = useCallback(
    async (
      payload: Omit<UnitConversionCreatePayloadModel, 'factory_id'> & {
        factory_id?: number;
      }
    ) => {
      const body: UnitConversionCreatePayloadModel = {
        // id 가 있으면 수정 모드, 없으면 null 로 명시적으로 전송
        id: payload.id ?? null,
        factory_id: payload.factory_id ?? (factoryId as number),
        material_id: payload.material_id ?? null,
        product_id: payload.product_id ?? null,
        from_unit: payload.from_unit ?? null,
        to_unit: payload.to_unit ?? null,
        from_quantity: payload.from_quantity,
        to_quantity: payload.to_quantity,
        conversion_rate: payload.conversion_rate ?? 1,
      };
      return call<UnitConversionModel>('create', { method: 'POST', body });
    },
    [call, factoryId]
  );

  const list = useCallback(
    async (params?: {
      page?: number;
      page_size?: number;
      q?: string;
      item_type?: 'material' | 'product' | 'all' | null;
    }) => {
      const queryParams: Record<
        string,
        string | number | boolean | null | undefined
      > = {
        factory_id: factoryId as number,
        page: params?.page,
        page_size: params?.page_size,
        q: params?.q,
      };

      // item_type이 'material' 또는 'product'일 때만 item_type으로 직접 전달
      // 'all'일 때는 파라미터를 보내지 않음 (백엔드가 전체 조회)
      if (
        params?.item_type &&
        (params.item_type === 'material' || params.item_type === 'product')
      ) {
        queryParams['item_type'] = params.item_type;
      }

      return call<UnitConversionListResponseModel>('list', {
        method: 'GET',
        queryParams,
      });
    },
    [call, factoryId]
  );

  // 특정 원자재에 대한 단위변환 정보 조회 (list[UnitConversionOutSchema])
  const getByMaterial = useCallback(
    async (materialId: number) => {
      return call<UnitConversionModel[]>('by-material', {
        method: 'GET',
        material_id: materialId,
        queryParams: { factory_id: factoryId as number },
      });
    },
    [call, factoryId]
  );

  // 특정 품목에 대한 단위변환 정보 조회 (list[UnitConversionOutSchema])
  const getByProduct = useCallback(
    async (productId: number) => {
      return call<UnitConversionModel[]>('by-product', {
        method: 'GET',
        product_id: productId,
        queryParams: { factory_id: factoryId as number },
      });
    },
    [call, factoryId]
  );

  const update = useCallback(
    async (
      unitConversionId: number,
      payload: Partial<Omit<UnitConversionCreatePayloadModel, 'factory_id'>> & {
        factory_id?: number;
      }
    ) => {
      const body: Partial<UnitConversionCreatePayloadModel> = {
        factory_id: payload.factory_id ?? (factoryId as number),
        material_id: payload.material_id,
        product_id: payload.product_id,
        from_unit: payload.from_unit,
        to_unit: payload.to_unit,
        conversion_rate: payload.conversion_rate,
      };
      return call<UnitConversionModel>('update', {
        method: 'PATCH',
        unit_conversion_id: unitConversionId,
        body,
      });
    },
    [call, factoryId]
  );

  const remove = useCallback(
    async (unitConversionId: number) => {
      return call<void>('delete', {
        method: 'DELETE',
        unit_conversion_id: unitConversionId,
        queryParams: { factory_id: factoryId as number },
      });
    },
    [call, factoryId]
  );

  return {
    call,
    create,
    list,
    getByMaterial,
    getByProduct,
    update,
    remove,
    isLoading,
    error,
  };
};

export default useUnitConversionApi;

// React Query mutation helpers
export const useCreateUnitConversionMutation = () => {
  const queryClient = useQueryClient();
  const { create } = useUnitConversionApi();
  return useMutation({
    mutationFn: async (
      payload: Omit<UnitConversionCreatePayloadModel, 'factory_id'> & {
        factory_id?: number;
      }
    ) => {
      const res = await create(payload);
      if (!res.success || !res.data) throw new Error(res.error || '생성 실패');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-conversion', 'list'] });
    },
  });
};

export const useUpdateUnitConversionMutation = () => {
  const queryClient = useQueryClient();
  const { update } = useUnitConversionApi();
  return useMutation({
    mutationFn: async (args: {
      id: number;
      payload: Partial<Omit<UnitConversionCreatePayloadModel, 'factory_id'>> & {
        factory_id?: number;
      };
    }) => {
      const res = await update(args.id, args.payload);
      if (!res.success || !res.data) throw new Error(res.error || '수정 실패');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-conversion', 'list'] });
    },
  });
};

export const useDeleteUnitConversionMutation = () => {
  const queryClient = useQueryClient();
  const { remove } = useUnitConversionApi();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await remove(id);
      if (!res.success) throw new Error(res.error || '삭제 실패');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-conversion', 'list'] });
    },
  });
};
