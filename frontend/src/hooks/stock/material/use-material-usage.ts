'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import {
  MaterialUsageModel,
  MaterialUsageResponseModel,
  MaterialUsageListResponseModel,
} from '@/types/data-model';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/v2/material-usage`;

export interface MaterialUsageListVariablesModel {
  planId: number;
}

export interface MaterialUsagePaginatedListVariablesModel {
  materialId?: number;
  materialRepackagingId?: number;
  page?: number;
  pageSize?: number;
}

interface CreateOrUpdateMaterialUsageVariablesModel {
  payload: MaterialUsageModel[];
  invalidateFilters?:
    | MaterialUsageListVariablesModel
    | MaterialUsagePaginatedListVariablesModel;
}

export const materialUsageQueryKey = (
  filters?: MaterialUsageListVariablesModel
) => ['material-usages', filters?.planId ?? null];

export const materialUsagePaginatedQueryKey = (
  filters?: MaterialUsagePaginatedListVariablesModel
) => [
  'material-usages-paginated',
  filters?.materialId ?? null,
  filters?.materialRepackagingId ?? null,
  filters?.page ?? null,
  filters?.pageSize ?? null,
];

const ensureFactoryId = (factoryId: number | null) => {
  if (!factoryId) {
    throw new Error('공장 ID가 설정되지 않았습니다.');
  }
  return factoryId;
};

export const useCreateOrUpdateMaterialUsageMutation = () => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const queryClient = useQueryClient();

  return useMutation<
    MaterialUsageResponseModel[],
    Error,
    CreateOrUpdateMaterialUsageVariablesModel
  >({
    mutationFn: async ({ payload }) => {
      const factoryIdParam = ensureFactoryId(factoryId);
      const response = await axios.post<MaterialUsageResponseModel[]>(
        BASE_URL,
        payload,
        {
          params: { factory_id: factoryIdParam },
          withCredentials: true,
        }
      );

      return response.data;
    },
    onSuccess: (_data, variables) => {
      if (variables?.invalidateFilters) {
        // Check if it's a plan-based filter or paginated filter
        if ('planId' in variables.invalidateFilters) {
          queryClient.invalidateQueries({
            queryKey: materialUsageQueryKey(variables.invalidateFilters),
          });
        } else {
          queryClient.invalidateQueries({
            queryKey: materialUsagePaginatedQueryKey(
              variables.invalidateFilters
            ),
          });
        }
      }
    },
  });
};

export const useMaterialUsageListMutation = () => {
  const factoryId = useMemberStore((state) => state.factoryId);

  return useMutation<
    MaterialUsageResponseModel[],
    Error,
    MaterialUsageListVariablesModel
  >({
    mutationFn: async ({ planId }) => {
      if (!planId) {
        throw new Error('planId는 필수입니다.');
      }
      const factoryIdParam = ensureFactoryId(factoryId);
      const response = await axios.get<MaterialUsageResponseModel[]>(BASE_URL, {
        params: {
          factory_id: factoryIdParam,
          plan_id: planId,
        },
        withCredentials: true,
      });

      return response.data;
    },
  });
};

export const useMaterialUsagePaginatedQuery = (
  options?: MaterialUsagePaginatedListVariablesModel
) => {
  const factoryId = useMemberStore((state) => state.factoryId);

  const queryKey = materialUsagePaginatedQueryKey(options);

  return useQuery<MaterialUsageListResponseModel, Error>({
    queryKey,
    queryFn: async () => {
      if (!factoryId) {
        throw new Error('공장 ID가 설정되지 않았습니다.');
      }

      if (!options?.materialId && !options?.materialRepackagingId) {
        throw new Error(
          'materialId 또는 materialRepackagingId 중 하나는 필수입니다.'
        );
      }

      const page = options?.page || 1;
      const pageSize = options?.pageSize || 10;

      const response = await axios.get<MaterialUsageListResponseModel>(
        `${BASE_URL}/paginated`,
        {
          params: {
            factory_id: factoryId,
            ...(options.materialId ? { material_id: options.materialId } : {}),
            ...(options.materialRepackagingId
              ? { material_repackaging_id: options.materialRepackagingId }
              : {}),
            page,
            page_size: pageSize,
          },
          withCredentials: true,
        }
      );

      return response.data;
    },
    enabled:
      !!factoryId &&
      (!!options?.materialId || !!options?.materialRepackagingId),
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });
};
