// 문서함 종류
export type DocumentType =
  | '주문서'
  | '생산지시서'
  | '거래명세서'
  | '매출 세금계산서'
  | '매입 세금계산서'
  | '현금영수증';

export const DocumentTypeColorMap: Record<
  DocumentType,
  {
    bgColor: string;
    textColor: string;
    color: 'yellow' | 'purple' | 'green' | 'secondary' | 'red' | 'orange';
  }
> = {
  주문서: { bgColor: 'bg-yellow-8', textColor: 'text-yellow', color: 'yellow' },
  생산지시서: {
    bgColor: 'bg-purple-8',
    textColor: 'text-purple',
    color: 'purple',
  },
  거래명세서: {
    bgColor: 'bg-green-8',
    textColor: 'text-green',
    color: 'green',
  },
  '매출 세금계산서': {
    bgColor: 'bg-primary-8',
    textColor: 'text-primary',
    color: 'secondary',
  },
  '매입 세금계산서': {
    bgColor: 'bg-red-8',
    textColor: 'text-red',
    color: 'red',
  },
  현금영수증: {
    bgColor: 'bg-orange-8',
    textColor: 'text-orange',
    color: 'orange',
  },
};

export interface DocumentDataModel {
  projectId: string;
  documentType: DocumentType;
  companyName: string;
  productName: string;
  date: string;
}
