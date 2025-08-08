import { useState, useCallback } from 'react';

interface DailyProductionQuantityModel {
  production_count: number;
  production_quantity: number;
  previous_month_count: number | null;
  previous_month_quantity: number | null;
  change_percentage: number | null;
}

// 오늘 완료된 생산 계획의 수량을 조회합니다. 전월 대비 수치도 포함됩니다.
const useGetDailyProductionQuantity = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDailyProductionQuantity = useCallback(
    async (targetDate?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // localStorage에서 factoryId 가져오기
        const factoryId = localStorage.getItem('factoryId');
        if (!factoryId) {
          throw new Error('공장 정보가 없습니다.');
        }

        // 쿼리 파라미터 구성
        const params = new URLSearchParams({
          factory_id: factoryId,
        });

        if (targetDate) {
          params.append('target_date', targetDate);
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/project/plan/daily?${params}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (response.ok) {
          const result: DailyProductionQuantityModel = await response.json();
          return { success: true, data: result };
        } else {
          const errorData = await response.json();

          switch (response.status) {
            case 400:
              setError(
                '올바르지 않은 날짜 형식입니다. YYYY-MM-DD 형식으로 입력해주세요.'
              );
              break;
            case 404:
              setError('해당 날짜의 생산 데이터가 없습니다.');
              break;
            case 500:
              setError('서버 내부 오류가 발생했습니다.');
              break;
            default:
              setError(errorData.detail || '오늘 생산량 조회에 실패했습니다.');
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
    []
  );

  return { getDailyProductionQuantity, isLoading, error };
};

export default useGetDailyProductionQuantity;
