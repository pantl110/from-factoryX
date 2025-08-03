import { SaveDraftQuotationModel } from '@/types/data-model';
import { useState, useEffect } from 'react';
import useFactoryStore from '@/store/factory-store';

interface StartProductionResponseModel {
  quotation_id: number;
  project_id: number;
  status: string; // ("production_started")
}

interface UseStartProductionReturnModel {
  startProduction: (
    data: SaveDraftQuotationModel
  ) => Promise<StartProductionResponseModel>;
  isLoading: boolean;
  error: string | null;
}

// 로컬스토리지에서 factoryId를 안전하게 가져오는 함수
const getStoredFactoryId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('factoryId');
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

// 생산 시작 // 완성된 견적서로 생산을 시작
// - 거래처 정보 업데이트
// - 납기 일자 설정
// - 품목 정보 업데이트
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

  const startProduction = async (
    data: SaveDraftQuotationModel
  ): Promise<StartProductionResponseModel> => {
    setIsLoading(true);
    setError(null);

    // 로컬스토리지에서 factoryId 가져오기
    const factoryId = getStoredFactoryId();
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
        throw new Error(
          errorData.detail || errorData.message || '주문 확정에 실패했습니다.'
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '생산 시작에 실패했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { startProduction, isLoading, error };
};

export default useStartProduction;
