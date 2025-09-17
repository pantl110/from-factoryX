'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import { WorkInstructionDetailResponseModel } from '@/types/data-model';

export interface WorkInstructionUpdateInModel {
  // 백엔드 스키마에 맞게 필요한 필드만 확장해서 사용하세요
  memo?: string;
}

const useUpdateWorkInstruction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const updateWorkInstruction = useCallback(
    async (
      workInstructionId: number,
      payload: WorkInstructionUpdateInModel
    ): Promise<{
      success: boolean;
      data?: WorkInstructionDetailResponseModel;
      error?: string;
    }> => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) throw new Error('공장 정보가 없습니다.');

        const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/document/work-instruction/${workInstructionId}`;
        const response = await axios.patch<WorkInstructionDetailResponseModel>(
          url,
          payload,
          {
            params: { factory_id: factoryId },
            withCredentials: true,
          }
        );

        return { success: true, data: response.data };
      } catch (err) {
        let message = '서버 연결에 실패했습니다.';
        if (axios.isAxiosError(err)) {
          const { status } = err.response || {};
          const { detail } = (err.response?.data as { detail?: string }) || {};
          switch (status) {
            case 400:
              message = detail || '잘못된 요청입니다.';
              break;
            case 401:
              message = '인증이 필요합니다.';
              break;
            case 403:
              message = '권한이 없습니다.';
              break;
            case 404:
              message = '작업 지시서를 찾을 수 없습니다.';
              break;
            default:
              message = detail || '작업 지시서 업데이트에 실패했습니다.';
          }
        } else if (err instanceof Error) {
          const { message: errorMessage } = err;
          message = errorMessage;
        }
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return { updateWorkInstruction, isLoading, error };
};

export default useUpdateWorkInstruction;
