'use client';

import { useCallback, useState } from 'react';

export interface TaxDocumentReadinessItemModel {
  id: number;
  tax_type: 'taxable' | 'exempt' | 'zero_rated' | 'unclassified';
  publish_status: string;
  ready: boolean;
  message: string;
  attempt_count: number;
  last_error: string;
}

export interface TaxDocumentGroupReadinessModel {
  group_key: string;
  can_publish: boolean;
  group_publish_enabled: boolean;
  external_request_sent: false;
  documents: TaxDocumentReadinessItemModel[];
}

interface ReadinessResultModel {
  success: boolean;
  data?: TaxDocumentGroupReadinessModel;
  error?: string;
}

const useTaxDocumentGroupReadiness = () => {
  const [isLoading, setIsLoading] = useState(false);

  const checkReadiness = useCallback(
    async (taxId: number): Promise<ReadinessResultModel> => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${taxId}/publish-group-readiness`,
          { method: 'GET', credentials: 'include' }
        );
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          return {
            success: false,
            error:
              body.detail || body.message || '발행 준비 확인에 실패했습니다.',
          };
        }
        return { success: true, data: await response.json() };
      } catch {
        return { success: false, error: '서버 연결에 실패했습니다.' };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { checkReadiness, isLoading };
};

export default useTaxDocumentGroupReadiness;
