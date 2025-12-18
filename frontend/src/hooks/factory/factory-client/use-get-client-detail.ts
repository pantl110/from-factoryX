'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ClientResponseModel } from '@/types/data-model';

const useGetClientDetail = (
  clientId: number | null,
  factoryId: number | null
) => {
  const isEnabled = !!clientId && !!factoryId;

  const query = useQuery<ClientResponseModel>({
    queryKey: ['client-detail', clientId, factoryId],
    queryFn: async () => {
      if (!clientId || !factoryId) {
        throw new Error('client_id와 factory_id가 필요합니다.');
      }

      if (!Number.isInteger(clientId) || clientId <= 0) {
        throw new Error('유효하지 않은 client_id입니다.');
      }

      if (!Number.isInteger(factoryId) || factoryId <= 0) {
        throw new Error('유효하지 않은 factory_id입니다.');
      }

      try {
        const response = await axios.get<ClientResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/client/${clientId}`,
          {
            params: {
              factory_id: factoryId,
            },
            withCredentials: true,
          }
        );

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new Error('거래처를 찾을 수 없습니다.');
          }
          const errorMessage =
            error.response?.data?.detail ||
            '거래처 상세 정보를 불러오는데 실패했습니다.';
          throw new Error(errorMessage);
        }
        throw new Error('서버 연결에 실패했습니다.');
      }
    },
    enabled: isEnabled,
    retry: false,
  });

  return {
    clientDetail: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
};

export default useGetClientDetail;
