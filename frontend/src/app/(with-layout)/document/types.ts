// 문서함 종류
export type DocumentType =
  | '주문서'
  | '생산지시서'
  | '거래명세서'
  | '매출 세금계산서'
  | '매입 세금계산서';

export const DocumentTypeColorMap: Record<
  DocumentType,
  { bgColor: string; textColor: string }
> = {
  주문서: { bgColor: 'bg-yellow-8', textColor: 'text-yellow' },
  생산지시서: { bgColor: 'bg-purple-8', textColor: 'text-purple' },
  거래명세서: { bgColor: 'bg-green-8', textColor: 'text-green' },
  '매출 세금계산서': { bgColor: 'bg-primary-8', textColor: 'text-primary' },
  '매입 세금계산서': { bgColor: 'bg-red-8', textColor: 'text-red' },
};

export interface DocumentDataModel {
  projectId: string;
  documentType: DocumentType;
  companyName: string;
  productName: string;
  date: string;
}
