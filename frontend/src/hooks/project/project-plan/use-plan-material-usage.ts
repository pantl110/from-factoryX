'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import {
  MaterialUsageModel,
  MaterialUsageResponseModel,
} from '@/types/data-model';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/v2/material-usage`;

export interface MaterialUsageListVariables {
  planId?: number;
  materialId?: number;
}

interface CreateOrUpdateMaterialUsageVariablesModel {
  payload: MaterialUsageModel[];
  invalidateFilters?: MaterialUsageListVariables;
}

interface DeleteMaterialUsageVariablesModel {
  usageId: number;
  invalidateFilters?: MaterialUsageListVariables;
}

export const materialUsageQueryKey = (filters?: MaterialUsageListVariables) => [
  'plan-material-usages',
  filters?.planId ?? null,
  filters?.materialId ?? null,
];

const ensureFactoryId = (factoryId: number | null) => {
  if (!factoryId) {
    throw new Error('공장 ID가 설정되지 않았습니다.');
  }
  return factoryId;
};

export const useCreateOrUpdatePlanMaterialUsageMutation = () => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const queryClient = useQueryClient();

  return useMutation<
    MaterialUsageResponseModel[],
    Error,
    CreateOrUpdateMaterialUsageVariablesModel
  >({
    mutationFn: async ({ payload }) => {
      const factory_id = ensureFactoryId(factoryId);
      const response = await axios.post<MaterialUsageResponseModel[]>(
        BASE_URL,
        payload,
        {
          params: { factory_id },
          withCredentials: true,
        }
      );

      return response.data;
    },
    onSuccess: (_data, variables) => {
      if (variables?.invalidateFilters) {
        queryClient.invalidateQueries({
          queryKey: materialUsageQueryKey(variables.invalidateFilters),
        });
      }
    },
  });
};

export const usePlanMaterialUsageListMutation = () => {
  const factoryId = useMemberStore((state) => state.factoryId);

  return useMutation<
    MaterialUsageResponseModel[],
    Error,
    MaterialUsageListVariables
  >({
    mutationFn: async ({ planId, materialId }) => {
      if (!planId && !materialId) {
        throw new Error('planId 또는 materialId는 최소 하나가 필요합니다.');
      }
      const factory_id = ensureFactoryId(factoryId);
      const response = await axios.get<MaterialUsageResponseModel[]>(BASE_URL, {
        params: {
          factory_id,
          ...(planId ? { plan_id: planId } : {}),
          ...(materialId ? { material_id: materialId } : {}),
        },
        withCredentials: true,
      });

      return response.data;
    },
  });
};

export const useDeletePlanMaterialUsageMutation = () => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteMaterialUsageVariablesModel>({
    mutationFn: async ({ usageId }) => {
      const factory_id = ensureFactoryId(factoryId);
      await axios.delete(`${BASE_URL}/${usageId}`, {
        params: { factory_id },
        withCredentials: true,
      });
    },
    onSuccess: (_data, variables) => {
      if (variables?.invalidateFilters) {
        queryClient.invalidateQueries({
          queryKey: materialUsageQueryKey(variables.invalidateFilters),
        });
      }
    },
  });
};
