'use client';

import { useCallback, useRef, useState } from 'react';

export interface TaxDocumentGroupPublishItemModel {
  id: number;
  status: 'published' | 'failed' | 'skipped' | 'blocked';
  attempt_count?: number;
  message: string;
}

export interface TaxDocumentGroupPublishModel {
  group_key: string;
  all_succeeded: boolean;
  external_request_sent: boolean;
  documents: TaxDocumentGroupPublishItemModel[];
}

interface PublishResultModel {
  success: boolean;
  data?: TaxDocumentGroupPublishModel;
  error?: string;
}

const usePublishTaxDocumentGroup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const inFlightRef = useRef(false);

  const publishGroup = useCallback(
    async (taxId: number): Promise<PublishResultModel> => {
      if (inFlightRef.current) {
        return { success: false, error: '이미 그룹 발행을 처리하고 있습니다.' };
      }
      inFlightRef.current = true;
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${taxId}/publish-group`,
          { method: 'POST', credentials: 'include' }
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          return {
            success: false,
            error:
              (typeof body.detail === 'string' && body.detail) ||
              body.message ||
              '세금 문서 그룹 발행에 실패했습니다.',
          };
        }
        return { success: true, data: body };
      } catch {
        return { success: false, error: '서버 연결에 실패했습니다.' };
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    []
  );

  return { publishGroup, isLoading };
};

export default usePublishTaxDocumentGroup;
