'use client';

import { WorkInstructionDetailResponseModel } from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import { useState, useCallback } from 'react';

interface UseGetWorkInstructionReturnModel {
  getWorkInstruction: (workInstructionId: number) => Promise<{
    success: boolean;
    data?: WorkInstructionDetailResponseModel;
    error?: string;
  }>;
  workInstruction: WorkInstructionDetailResponseModel | null;
  isLoading: boolean;
  error: string | null;
}

const useGetWorkInstruction = (): UseGetWorkInstructionReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [workInstruction, setWorkInstruction] = useState<WorkInstructionDetailResponseModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { factoryId } = useMemberStore();

  const getWorkInstruction = useCallback(
    async (workInstructionId: number) => {
      if (!workInstructionId) {
        const msg = 'workInstructionId가 필요합니다.';
        setError(msg);
        return { success: false, error: msg };
      }
      if (!factoryId) {
        const msg = 'factoryId가 필요합니다.';
        setError(msg);
        return { success: false, error: msg };
      }

      setIsLoading(true);
      setError(null);

      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/document/work-instruction/${workInstructionId}?factory_id=${factoryId}`;
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result: WorkInstructionDetailResponseModel = await response.json();
          setWorkInstruction(result);
          return { success: true, data: result };
        } else {
          let message = '작업 지시서를 불러오지 못했습니다.';
          try {
            const errData = await response.json();
            message = errData.detail || message;
          } catch (e) {
            // noop
          }
          setError(message);
          return { success: false, error: message };
        }
      } catch (err) {
        console.error('Work instruction fetch error:', err);
        const message = '서버 연결에 실패했습니다.';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { getWorkInstruction, workInstruction, isLoading, error };
};

export default useGetWorkInstruction;


