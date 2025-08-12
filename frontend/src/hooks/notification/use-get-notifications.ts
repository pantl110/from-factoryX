'use client';

import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';
import { NotificationListResponseModel } from '@/types/data-model';

const useGetNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useFactoryStore();

  const getNotifications = useCallback(
    async (
      page: number,
      size: number
    ): Promise<{ success: boolean; data?: NotificationListResponseModel }> => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          setError('Factory ID를 찾을 수 없습니다.');
          return { success: false };
        }

        const queryParams = new URLSearchParams();
        queryParams.append('factory_id', factoryId.toString());
        queryParams.append('page', page.toString());
        queryParams.append('size', size.toString());

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/notification?${queryParams}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const result: NotificationListResponseModel = await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.detail || '알림 조회에 실패했습니다.';
          setError(errorMessage);
          return { success: false };
        }
      } catch {
        const errorMessage = '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return { getNotifications, isLoading, error };
};

export default useGetNotifications;
