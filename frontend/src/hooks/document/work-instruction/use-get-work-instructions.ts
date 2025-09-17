import { useState, useCallback } from 'react';
import axios from 'axios';
import useMemberStore from '@/store/member-store';
import { WorkInstructionListResponseModel } from '@/types/data-model';

// 작업 지시서 목록을 조회하는 훅
const useGetWorkInstructions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const getWorkInstructions = useCallback(
    async (
      orderBy: string = '-created_at',
      page: number = 1,
      pageSize: number = 10,
      q?: string | null
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          throw new Error('공장 정보가 없습니다.');
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/document/work-instruction`,
          {
            params: {
              factory_id: factoryId,
              order_by: orderBy,
              page,
              page_size: pageSize,
              q: q ?? undefined,
            },
            withCredentials: true,
          }
        );

        const result: WorkInstructionListResponseModel = response.data;
        return { success: true, data: result };
      } catch (err) {
        let errorMessage = '서버 연결에 실패했습니다.';

        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          const errorData = err.response?.data;

          // 백엔드 에러 코드에 따른 구체적인 메시지
          switch (status) {
            case 400:
              errorMessage = '잘못된 요청입니다. factory_id를 확인해주세요.';
              break;
            case 404:
              errorMessage = '작업 지시서를 찾을 수 없습니다.';
              break;
            case 500:
              errorMessage = '서버 내부 오류가 발생했습니다.';
              break;
            default:
              errorMessage =
                errorData?.detail || '작업 지시서 조회에 실패했습니다.';
          }
        } else {
          errorMessage =
            err instanceof Error ? err.message : '서버 연결에 실패했습니다.';
        }

        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [factoryId]
  );

  return { getWorkInstructions, isLoading, error };
};

export default useGetWorkInstructions;
