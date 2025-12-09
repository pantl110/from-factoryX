'use client';

import { ProductionDataModel } from '@/types/data-model';
import { useState } from 'react';
import useMemberStore from '@/store/member-store';

interface StartProductionResponseModel {
  quotation_id: number;
  project_id: number;
  status: string; // ("production_started")
}

interface UseStartProductionReturnModel {
  startProduction: (
    data: ProductionDataModel
  ) => Promise<StartProductionResponseModel>;
  isLoading: boolean;
  error: string | null;
}

// 생산 시작 // 완성된 견적서로 생산을 시작
// - 거래처 정보 업데이트
// - 납기 일자 설정
// - 제품 정보 업데이트
// - 프로젝트 상태 변경 (pending)으로
// - 생산계획 자동 생성: 각 products의 제품에 대해
//   - 해당 제품의 QuotationProduct 찾고
//   - 설비 자동 할당: 가동 대기 상태, priority 순서
//   - 해당 제품의 생산계획 생성
// - 기본 값 설정
//   - quantity: products의 quantity 사용
//   - start_date 오늘
//   - end_date 7일 후
//   - avg_production_time 기본 1시간
// - 생산 계획 생성
const useStartProduction = (): UseStartProductionReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const startProduction = async (
    data: ProductionDataModel
  ): Promise<StartProductionResponseModel> => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      const errorMessage = '공장 ID가 설정되지 않았습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/product/confirmed?factory_id=${factoryId}`;

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || errorData.message || '생산 시작에 실패했습니다.';

        // 400 에러인 경우 특별한 메시지 처리
        if (
          response.status === 400 &&
          errorData.detail.includes('해당 공장에 가동 가능한 설비가 없습니다')
        ) {
          throw new Error(
            '해당 공장에 가동 가능한 설비가 없습니다. 설비 등록 후 생산을 시작해 주세요.'
          );
        }

        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '생산 시작에 실패했습니다.';
      setError(errorMessage);
      // 에러 발생 시 에러를 다시 throw
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { startProduction, isLoading, error };
};

export default useStartProduction;
