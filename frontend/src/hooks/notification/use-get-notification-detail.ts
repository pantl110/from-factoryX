'use client';

import { useState, useCallback } from 'react';
import useMemberStore from '@/store/member-store';
import { NotificationResponseModel } from '@/types/data-model';

const useGetNotificationDetail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useMemberStore();

  const getNotificationDetail = useCallback(
    async (
      notificationId: number
    ): Promise<{ success: boolean; data?: NotificationResponseModel }> => {
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
          `${process.env.NEXT_PUBLIC_API_URL}/v1/notification/${notificationId}?${queryParams}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const result: NotificationResponseModel = await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail || '알림 상세 조회에 실패했습니다.';
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

  return { getNotificationDetail, isLoading, error };
};

export default useGetNotificationDetail;
