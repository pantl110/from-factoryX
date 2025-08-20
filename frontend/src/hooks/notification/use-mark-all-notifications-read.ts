'use client';

import { useState, useCallback } from 'react';
import useFactoryStore from '@/store/factory-store';
import { NotificationResponseModel } from '@/types/data-model';

const useMarkAllNotificationsRead = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useFactoryStore();

  const markAllAsRead = useCallback(async (): Promise<{
    success: boolean;
    data?: NotificationResponseModel[];
  }> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!factoryId) {
        setError('Factory ID를 찾을 수 없습니다.');
        return { success: false };
      }

      const queryParams = new URLSearchParams();
      queryParams.append('factory_id', factoryId.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/notification/read?${queryParams}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        const result: NotificationResponseModel[] = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || '알림 읽음 처리에 실패했습니다.';
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
  }, [factoryId]);

  return { markAllAsRead, isLoading, error };
};

export default useMarkAllNotificationsRead;
