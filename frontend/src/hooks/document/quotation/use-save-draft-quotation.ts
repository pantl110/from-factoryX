import { SaveDraftQuotationModel } from '@/types/data-model';
import { useState } from 'react';

interface SaveDraftQuotationResponseModel {
  quotation_id: number;
  status: string; // draft_saved
}

interface UseSaveDraftQuotationReturnModel {
  saveDraft: (
    data: SaveDraftQuotationModel
  ) => Promise<SaveDraftQuotationResponseModel>;
  isLoading: boolean;
  error: string | null;
}

// 견적서 임시 저장
// - 거래저 정보 업데이트
// - 납기일자 업데이트
// - 프로젝트 상태를 'quotation'으로 변경
// - 품목 정보 업데이트
const useSaveDraftQuotation = (): UseSaveDraftQuotationReturnModel => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveDraft = async (
    data: SaveDraftQuotationModel
  ): Promise<SaveDraftQuotationResponseModel> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/product/draft`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || '견적서 임시 저장에 실패했습니다.'
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '견적서 임시 저장에 실패했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { saveDraft, isLoading, error };
};

export default useSaveDraftQuotation;
