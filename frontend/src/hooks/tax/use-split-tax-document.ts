'use client';

import { useCallback, useState } from 'react';

export interface TaxSplitTotalsModel {
  supply_amount: number;
  tax_amount: number;
  total_amount: number;
}

export interface TaxSplitDocumentModel {
  id?: number;
  tax_type: 'taxable' | 'exempt';
  document_kind: 'tax_invoice' | 'invoice';
  label: string;
  item_count: number;
  line_items?: Array<{
    id?: number;
    name?: string;
    tax_type?: 'taxable' | 'exempt';
    amount?: string;
    tax?: string;
    code?: string | null;
    information?: string;
    chargeable_unit?: string;
    unit_price?: string;
  }>;
  totals: TaxSplitTotalsModel;
  publish_status?: string;
}

export interface TaxSplitPreviewModel {
  source_document_id?: number;
  requires_split?: boolean;
  created?: boolean;
  group_key?: string;
  source_totals: TaxSplitTotalsModel;
  split_totals: TaxSplitTotalsModel;
  is_balanced: boolean;
  documents: TaxSplitDocumentModel[];
}

interface TaxSplitResultModel {
  success: boolean;
  data?: TaxSplitPreviewModel;
  error?: string;
}

const parseError = async (response: Response, fallback: string) => {
  try {
    const body = await response.json();
    return body.detail || body.message || fallback;
  } catch {
    return fallback;
  }
};

const useSplitTaxDocument = () => {
  const [isLoading, setIsLoading] = useState(false);

  const request = useCallback(
    async (
      taxId: number,
      suffix: 'split-preview' | 'split' | 'split-document' | 'reset-split',
      method: 'GET' | 'POST',
      body?: object
    ): Promise<TaxSplitResultModel> => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/tax/${taxId}/${suffix}`,
          {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
          }
        );
        if (!response.ok) {
          return {
            success: false,
            error: await parseError(response, '문서 분리 요청에 실패했습니다.'),
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

  return {
    getSplitPreview: (taxId: number) => request(taxId, 'split-preview', 'GET'),
    splitTaxDocument: (taxId: number) => request(taxId, 'split', 'POST'),
    splitGroupDocument: (
      taxId: number,
      selectedIndexes: number[],
      expectedLineItemCount: number
    ) =>
      request(taxId, 'split-document', 'POST', {
        selected_line_item_indexes: selectedIndexes,
        expected_line_item_count: expectedLineItemCount,
      }),
    resetSplitGroup: (taxId: number) => request(taxId, 'reset-split', 'POST'),
    isLoading,
  };
};

export default useSplitTaxDocument;
