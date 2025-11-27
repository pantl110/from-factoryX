'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import {
  MaterialUsageModel,
  MaterialUsageResponseModel,
} from '@/types/data-model';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/v2/material-usage`;

export interface MaterialUsageListVariablesModel {
  planId?: number;
  materialId?: number;
}

interface CreateOrUpdateMaterialUsageVariablesModel {
  payload: MaterialUsageModel[];
  invalidateFilters?: MaterialUsageListVariablesModel;
}

export const materialUsageQueryKey = (
  filters?: MaterialUsageListVariablesModel
) => [
  'material-usages',
  filters?.planId ?? null,
  filters?.materialId ?? null,
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
        queryClient.invalidateQueries({
          queryKey: materialUsageQueryKey(variables.invalidateFilters),
        });
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
    mutationFn: async ({ planId, materialId }) => {
      if (!planId && !materialId) {
        throw new Error('planId 또는 materialId는 최소 하나가 필요합니다.');
      }
      const factoryIdParam = ensureFactoryId(factoryId);
      const response = await axios.get<MaterialUsageResponseModel[]>(BASE_URL, {
        params: {
          factory_id: factoryIdParam,
          ...(planId ? { plan_id: planId } : {}),
          ...(materialId ? { material_id: materialId } : {}),
        },
        withCredentials: true,
      });

      return response.data;
    },
  });
};
