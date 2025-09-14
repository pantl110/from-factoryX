import { useState, useCallback } from 'react';
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
      pageSize: number = 10
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!factoryId) {
          throw new Error('공장 정보가 없습니다.');
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/document/work-instruction?factory_id=${factoryId}&order_by=${orderBy}&page=${page}&page_size=${pageSize}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (response.ok) {
          const result: WorkInstructionListResponseModel =
            await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();

          // 백엔드 에러 코드에 따른 구체적인 메시지
          switch (response.status) {
            case 400:
              setError('잘못된 요청입니다. factory_id를 확인해주세요.');
              break;
            case 404:
              setError('작업 지시서를 찾을 수 없습니다.');
              break;
            case 500:
              setError('서버 내부 오류가 발생했습니다.');
              break;
            default:
              setError(errorData.detail || '작업 지시서 조회에 실패했습니다.');
          }
          return { success: false, error: errorData.detail };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '서버 연결에 실패했습니다.';
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
