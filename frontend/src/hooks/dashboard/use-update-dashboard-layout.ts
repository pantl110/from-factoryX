'use client';

import { useCallback } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';
import useMemberStore from '@/store/member-store';
import {
  WidgetLayoutModel,
  DashboardLayoutResponseModel,
} from '@/types/data-model';
import { DASHBOARD_LAYOUT_QUERY_KEY } from './use-get-dashboard-layout';

const useUpdateDashboardLayout = (debounceMs: number = 1000) => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const queryClient = useQueryClient();

  const mutation = useMutation<
    DashboardLayoutResponseModel,
    Error,
    WidgetLayoutModel[]
  >({
    mutationFn: async (widgets: WidgetLayoutModel[]) => {
      if (!factoryId) {
        throw new Error('Factory ID를 찾을 수 없습니다.');
      }

      const response = await axios.put<DashboardLayoutResponseModel>(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/factory/member/me/dashboard-layout`,
        { widgets },
        {
          params: { factory_id: factoryId },
          withCredentials: true,
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData([DASHBOARD_LAYOUT_QUERY_KEY, factoryId], data);
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          '대시보드 레이아웃 저장에 실패했습니다.';
        console.error(message);
      }
    },
  });

  // debounced mutation
  const debouncedMutate = useDebouncedCallback(
    (widgets: WidgetLayoutModel[]) => {
      mutation.mutate(widgets);
    },
    debounceMs
  );

  // debounced version
  const updateDashboardLayout = useCallback(
    (widgets: WidgetLayoutModel[]) => {
      debouncedMutate(widgets);
    },
    [debouncedMutate]
  );

  // immediate save (skip debounce)
  const updateDashboardLayoutImmediate = useCallback(
    (widgets: WidgetLayoutModel[]) => {
      debouncedMutate.cancel();
      return mutation.mutateAsync(widgets);
    },
    [debouncedMutate, mutation]
  );

  return {
    updateDashboardLayout,
    updateDashboardLayoutImmediate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

export default useUpdateDashboardLayout;
