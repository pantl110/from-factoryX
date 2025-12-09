'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import {
  CreateSubstituteModel,
  SubstituteDetailResponseModel,
} from '@/types/data-model';

interface UseCreateSubstituteReturnModel {
  createSubstitute: (data: CreateSubstituteModel) => Promise<{
    success: boolean;
    data?: SubstituteDetailResponseModel;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

const useCreateSubstitute = (): UseCreateSubstituteReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const createSubstitute = useCallback(
    async (data: CreateSubstituteModel) => {
      setIsLoading(true);
      setError(null);

      if (!factoryId) {
        const errorMessage = '공장 ID가 설정되지 않았습니다.';
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, error: errorMessage };
      }

      try {
        const response = await axios.post<SubstituteDetailResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/substitute`,
          data,
          {
            params: {
              factory_id: factoryId,
            },
            withCredentials: true,
          }
        );

        if (response.status === 201) {
          return { success: true, data: response.data };
        } else {
          const errorMessage = '대체 자재 관계 생성에 실패했습니다.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch (err: unknown) {
        const errorMessage =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || '서버 연결에 실패했습니다.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return { createSubstitute, isLoading, error };
};

export default useCreateSubstitute;
