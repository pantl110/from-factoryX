import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';
import { ShortageMaterialCountModel } from '@/app/(with-layout)/dashboard/type';

const useGetInsufficientMaterialCount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useFactoryStore();

  const getInsufficientMaterialCount = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!factoryId) {
        const message = 'Factory ID를 찾을 수 없습니다.';
        setError(message);
        return { success: false, error: message } as const;
      }

      const search = new URLSearchParams();
      search.append('factory_id', factoryId.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/shortage?${search.toString()}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.status === 200) {
        const data: ShortageMaterialCountModel = await response.json();
        return { success: true, data } as const;
      }

      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData?.detail || '부족한 원자재 수 조회에 실패했습니다.';
      setError(message);
      return { success: false, error: message } as const;
    } catch {
      const message = '서버 연결에 실패했습니다.';
      setError(message);
      return { success: false, error: message } as const;
    } finally {
      setIsLoading(false);
    }
  }, [factoryId]);

  return { getInsufficientMaterialCount, isLoading, error };
};

export default useGetInsufficientMaterialCount;
