'use client';

import { useState, useCallback } from 'react';
import useMemberStore from '@/store/member-store';
import {
  CreateOrUpdateProjectPlanModel,
} from '@/types/data-model';

export interface CreateOrUpdateProjectPlanResponseModel {
    message: string;
    plan_id: number;
    action: 'created' | 'updated';
  }

const useCreateOrUpdateProjectPlan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const createOrUpdateProjectPlan = useCallback(
    async (
      payload: CreateOrUpdateProjectPlanModel
    ): Promise<{ success: boolean; data?: CreateOrUpdateProjectPlanResponseModel }> => {
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
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project-plan/create-or-update?${queryParams}`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          const result: CreateOrUpdateProjectPlanResponseModel = await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail || '프로젝트 생산 계획 생성 또는 수정에 실패했습니다.';
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

  return { createOrUpdateProjectPlan, isLoading, error };
};

export default useCreateOrUpdateProjectPlan;
