'use client';

import { useTranslations } from 'next-intl';
import { DocumentType } from './types';
import useSubscriptionStore from '@/store/subscription-store';

interface MainTitleSecProps {
  selectedType: DocumentType;
  setSelectedType: (type: DocumentType) => void;
}

const MainTitleSec = ({ selectedType, setSelectedType }: MainTitleSecProps) => {
  const tDocument = useTranslations('document');
  const tDocumentType = useTranslations('document.type');
  const isPartnersSubscription = useSubscriptionStore((state) =>
    state.isPartnersSubscription()
  );

  const documentTypes: DocumentType[] = isPartnersSubscription
    ? [
        '주문서',
        '생산지시서',
        '거래명세서',
        '매출 세금계산서',
        '매입 세금계산서',
        '현금영수증',
      ]
    : ['주문서', '생산지시서', '거래명세서'];

  // 문서 타입별 번역 텍스트 가져오기
  const getDocumentTypeText = (type: DocumentType): string => {
    switch (type) {
      case '주문서':
        return tDocumentType('orderDocument');
      case '생산지시서':
        return tDocumentType('productionInstruction');
      case '거래명세서':
        return tDocumentType('transactionStatementTitle');
      case '매출 세금계산서':
        return tDocumentType('salesTaxInvoice');
      case '매입 세금계산서':
        return tDocumentType('purchaseTaxInvoice');
      case '현금영수증':
        return tDocumentType('cashReceipt');
      default:
        return type;
    }
  };

  return (
    <div className="flex flex-col gap-8 pt-10 px-10">
      <h1 className="Heading-1 text-dg">{tDocument('title')}</h1>
      <div className="flex gap-4 items-center Heading-3">
        {documentTypes.map((type) => (
          <button
            key={type}
            type="button"
            className={`cursor-pointer Heading-3 ${selectedType === type ? 'text-dg' : 'text-gr'}`}
            onClick={() => setSelectedType(type as DocumentType)}
          >
            {getDocumentTypeText(type)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainTitleSec;
