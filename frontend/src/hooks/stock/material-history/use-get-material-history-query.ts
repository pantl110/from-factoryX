import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { MaterialHistoryListResponseModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';

export interface GetMaterialHistoryOptionModel {
  type?: 'purchase' | 'consumption';
  start_date?: string;
  end_date?: string;
  is_linked?: boolean;
  material_id?: number;
  material_name?: string;
  client_id?: number;
  receipt_id?: number;
  page?: number;
  page_size?: number;
}

// queryFn을 별도 함수로 export하여 재사용 가능하도록 함
export const getMaterialHistoryQueryFn = async (
  factoryId: number,
  options?: GetMaterialHistoryOptionModel
): Promise<MaterialHistoryListResponseModel> => {
  if (!factoryId) {
    throw new Error('공장 ID가 설정되지 않았습니다.');
  }

  const page = options?.page || 1;
  const pageSize = options?.page_size || 5;

  try {
    const response = await axios.get<MaterialHistoryListResponseModel>(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/history`,
      {
        params: {
          factory_id: factoryId,
          ...(options?.material_id && { material_id: options.material_id }),
          ...(options?.start_date && { start_date: options.start_date }),
          ...(options?.end_date && { end_date: options.end_date }),
          ...(options?.type && { type: options.type }),
          ...(options?.is_linked !== undefined && {
            is_linked: options.is_linked,
          }),
          ...(options?.material_name && {
            material_name: options.material_name,
          }),
          ...(options?.client_id && { client_id: options.client_id }),
          ...(options?.receipt_id && { receipt_id: options.receipt_id }),
          page,
          page_size: pageSize,
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        '원자재 히스토리 조회에 실패했습니다.';
      throw new Error(message);
    }
    throw new Error('서버 연결에 실패했습니다.');
  }
};

// queryKey 생성 함수도 export
export const getMaterialHistoryQueryKey = (
  factoryId: number | null,
  options?: GetMaterialHistoryOptionModel
) => {
  const page = options?.page || 1;
  const pageSize = options?.page_size || 5;
  return [
    'material-history',
    factoryId,
    options?.type,
    options?.start_date,
    options?.end_date,
    options?.is_linked,
    options?.material_id,
    options?.material_name,
    options?.client_id,
    options?.receipt_id,
    page,
    pageSize,
  ];
};

// 원자재 히스토리를 조회합니다. material_id가 제공되면 특정 원자재의 히스토리를, 제공되지 않으면 전체 원자재 히스토리를 조회합니다.
// 기간 설정이 없으면 전체 히스토리를, 기간 설정이 있으면 해당 기간의 히스토리를 조회합니다.
// client_id 필터가 추가되어 특정 거래처의 원자재 히스토리만 조회할 수 있습니다.
const useGetMaterialHistory = (options?: GetMaterialHistoryOptionModel) => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => getMaterialHistoryQueryKey(factoryId, options),
    [factoryId, options]
  );

  const query = useQuery<MaterialHistoryListResponseModel, Error>({
    queryKey,
    queryFn: () => {
      if (!factoryId) {
        throw new Error('공장 ID가 설정되지 않았습니다.');
      }
      return getMaterialHistoryQueryFn(factoryId, options);
    },
    enabled: !!factoryId,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  // 수동으로 데이터를 가져오는 함수 (queryClient.fetchQuery 사용)
  const getMaterialHistory = useCallback(
    async (
      fetchOptions?: GetMaterialHistoryOptionModel
    ): Promise<{
      success: boolean;
      data?: MaterialHistoryListResponseModel;
      error?: string;
    }> => {
      if (!factoryId) {
        return {
          success: false,
          error: '공장 ID가 설정되지 않았습니다.',
        };
      }

      try {
        const queryKey = getMaterialHistoryQueryKey(factoryId, fetchOptions);
        const data =
          await queryClient.fetchQuery<MaterialHistoryListResponseModel>({
            queryKey,
            queryFn: () => getMaterialHistoryQueryFn(factoryId, fetchOptions),
            staleTime: 0,
          });

        return { success: true, data };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : '원자재 히스토리 조회에 실패했습니다.';
        return { success: false, error: errorMessage };
      }
    },
    [factoryId, queryClient]
  );

  return {
    histories: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
    isError: query.isError,
    isSuccess: query.isSuccess,
    getMaterialHistory,
  };
};

export default useGetMaterialHistory;
