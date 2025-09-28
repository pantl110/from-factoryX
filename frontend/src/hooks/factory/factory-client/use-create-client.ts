import { useState } from 'react';
import axios from 'axios';
import { ClientModel, ClientResponseModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';

const useCreateClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const createClient = async (data: ClientModel) => {
    setIsLoading(true);
    setError(null);

    // factoryId 체크
    if (!factoryId) {
      setError('공장 정보를 찾을 수 없습니다.');
      setIsLoading(false);
      return { success: false, error: '공장 정보를 찾을 수 없습니다.' };
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/client`,
        data,
        {
          params: {
            factory_id: factoryId,
          },
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        const result: ClientResponseModel = response.data;
        return { success: true, data: result };
      } else {
        setError('거래처 등록에 실패했습니다.');
        return { success: false, error: '거래처 등록에 실패했습니다.' };
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || '서버 연결에 실패했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { createClient, isLoading, error };
};

export default useCreateClient;
