'use client';

import { useState, useCallback } from 'react';
import useMemberStore from '@/store/member-store';
import { ProfitDetailResponseModel } from '@/types/data-model';

const useGetProfitDetail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { factoryId } = useMemberStore();

  const getProfitDetail = useCallback(
    async (params?: {
      from?: string;
      to?: string;
    }): Promise<{
      success: boolean;
      data?: ProfitDetailResponseModel;
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
        if (params?.from) queryParams.append('start', params.from);
        if (params?.to) queryParams.append('end', params.to);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project-plan/profit/detail?${queryParams}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const result: ProfitDetailResponseModel = await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail || '수익 상세 조회에 실패했습니다.';
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

  return { getProfitDetail, isLoading, error };
};

export default useGetProfitDetail;
