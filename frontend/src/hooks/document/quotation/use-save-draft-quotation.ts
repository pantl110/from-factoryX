import { SaveDraftDataModel } from '@/types/data-model';
import { useState } from 'react';
import useMemberStore from '@/store/member-store';

interface SaveDraftQuotationResponseModel {
  quotation_id: number;
  project_id: number;
  client_id: number;
  status: string; // confirmed 또는 draft_saved
}

interface UseSaveDraftQuotationReturnModel {
  saveDraft: (
    data: SaveDraftDataModel
  ) => Promise<SaveDraftQuotationResponseModel>;
  isLoading: boolean;
  error: string | null;
}

// 견적서 생성 & 임시 저장 & 주문 확정
// - 거래처 정보 업데이트
// - 납기일자 업데이트
// - 제품 정보 업데이트
// - 프로젝트 상태 변경 (quotation 또는 confirmed)
const useSaveDraftQuotation = (): UseSaveDraftQuotationReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factoryId = useMemberStore((state) => state.factoryId);

  const saveDraft = async (
    data: SaveDraftDataModel
  ): Promise<SaveDraftQuotationResponseModel> => {
    setIsLoading(true);
    setError(null);

    if (!factoryId) {
      const errorMessage = '공장 ID가 설정되지 않았습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/product/save?factory_id=${factoryId}`;

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
          errorData.message || errorData.detail || '견적서 저장에 실패했습니다.'
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '견적서 저장에 실패했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { saveDraft, isLoading, error };
};

export default useSaveDraftQuotation;
