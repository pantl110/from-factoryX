import { useCallback, useState } from 'react';
import useMemberStore from '@/store/member-store';
import axios from 'axios';

interface ManufacturedToDeliveryResultModel {
  message: string;
  project_id: number;
  status: string;
  processed_at: string;
}

const useManufacturedToDelivery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const manufacturedToDelivery = useCallback(
    async (projectId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          throw new Error('factory_id를 찾을 수 없습니다.');
        }

        const { data } = await axios.post<ManufacturedToDeliveryResultModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project/manufactured-to-delivery/${projectId}`,
          {},
          {
            withCredentials: true,
            params: { factory_id: factoryId },
          }
        );

        return { success: true as const, data };
      } catch (err: unknown) {
        const msg = axios.isAxiosError(err)
          ? (
              err.response?.data as
                | { detail?: string; message?: string }
                | undefined
            )?.detail ||
            (
              err.response?.data as
                | { detail?: string; message?: string }
                | undefined
            )?.message ||
            err.message
          : '요청 중 오류가 발생했습니다.';
        setError(msg);
        return { success: false as const, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return { manufacturedToDelivery, isLoading, error };
};

export default useManufacturedToDelivery;
