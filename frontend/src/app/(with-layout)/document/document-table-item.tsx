import { DocumentDataModel } from '@/mocks/document-data';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import Chip from '@/ui/chip';
import { DocumentTypeColorMap } from './types';
import Checkbox from '@/ui/checkbox';
import { useState } from 'react';
import Panel from '@/ui/panel';
import TaxDocumentView from './tax-document-view';
import { getProductNamesDisplay } from '@/utils/get-product-names-display';

interface DocumentTableItemProps {
  data: DocumentDataModel | PublishedTaxInvoiceResponseModel;
  onClick?: () => void;
  checked: boolean;
  onToggle: () => void;
  isTaxDocument?: boolean;
}

const DocumentTableItem = ({
  data,
  onClick,
  checked,
  onToggle,
  isTaxDocument = false,
}: DocumentTableItemProps) => {
  const [isTaxPanelOpen, setIsTaxPanelOpen] = useState(false);

  // 타입 가드 함수
  const isDocumentData = (
    item: DocumentDataModel | PublishedTaxInvoiceResponseModel
  ): item is DocumentDataModel => {
    return 'documentType' in item;
  };

  const isTaxData = (
    item: DocumentDataModel | PublishedTaxInvoiceResponseModel
  ): item is PublishedTaxInvoiceResponseModel => {
    return 'tax_invoice_type' in item; // sales, purchase
  };

  // DocumentDataModel 타입일 때의 데이터 // 주문서, 생산지시서, 거래명세서
  const documentData = isDocumentData(data) ? data : null;
  const { bgColor, textColor } = documentData
    ? DocumentTypeColorMap[documentData.documentType]
    : { bgColor: '', textColor: '' };

  // 세금계산서 클릭 핸들러
  const handleTaxDocumentClick = () => {
    if (isTaxDocument && isTaxData(data)) {
      setIsTaxPanelOpen(true);
    }
  };

  return (
    <>
      <div
        className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200"
        role="button"
        tabIndex={0}
        onClick={isTaxDocument ? handleTaxDocumentClick : onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (isTaxDocument) {
              handleTaxDocumentClick();
            } else {
              onClick?.();
            }
          }
        }}
      >
        <Checkbox isChecked={checked} onToggle={onToggle} />
        {isTaxDocument && isTaxData(data) ? (
          <>
            <p
              className="px-3 flex-1 truncate"
              title={data.client_info.name || '-'}
            >
              {data.client_info.name || '-'}
            </p>
            <p
              className="px-3 flex-1 truncate"
              title={getProductNamesDisplay(
                data.products_info?.map((p) => p.name) || []
              )}
            >
              {getProductNamesDisplay(
                data.products_info?.map((p) => p.name) || []
              )}
            </p>
            <p
              className="px-3 flex-1 truncate"
              title={data.transaction_amount?.toLocaleString() || '-'}
            >
              {data.transaction_amount?.toLocaleString() || '-'}
            </p>
            <p
              className="px-3 flex-1 truncate"
              title={data.tax_amount?.toLocaleString() || '-'}
            >
              {data.tax_amount?.toLocaleString() || '-'}
            </p>
            <p
              className="px-3 flex-1 truncate"
              title={
                (data.transaction_amount + data.tax_amount)?.toLocaleString() ||
                '-'
              }
            >
              {(data.transaction_amount + data.tax_amount)?.toLocaleString() ||
                '-'}
            </p>
            <p className="px-3 w-[150px]">
              {data.updated_at.split('T')[0] || '-'}
            </p>
            <p className="px-3 w-[150px]">{data.transaction_date || '-'}</p>
          </>
        ) : documentData ? (
          <>
            <div className="px-3 flex-[0.5]">
              <Chip
                text={documentData.documentType}
                bgColor={bgColor}
                textColor={textColor}
              />
            </div>
            <p className="px-3 flex-1">{documentData.companyName}</p>
            <p className="px-3 flex-1">{documentData.productName}</p>
            <p className="px-3 flex-[0.5]">{documentData.date}</p>
          </>
        ) : null}
      </div>

      {/* 세금계산서 디테일 판넬  */}
      {isTaxPanelOpen && isTaxData(data) && (
        <Panel
          title={
            data.tax_invoice_type === 'sales'
              ? '매출 세금계산서'
              : '매입 세금계산서'
          }
          onClose={() => setIsTaxPanelOpen(false)}
        >
          <TaxDocumentView taxId={data.id} />
        </Panel>
      )}
    </>
  );
};

export default DocumentTableItem;
