import { DocumentDataModel } from '@/mocks/document-data';
import {
  PublishedTaxInvoiceResponseModel,
  ProjectResponseModel,
  ProjectStatusResponseModel,
} from '@/types/data-model';
import Chip from '@/ui/chip';
import { DocumentTypeColorMap } from './types';
import { useState, useEffect } from 'react';
import Panel from '@/ui/panel';
import TaxDocumentView from './tax-document-view';
import { getProductNamesDisplay } from '@/utils/get-product-names-display';
import TransactionDocumentView from './transaction-document-view';
import { useGetProjectStatus } from '@/hooks';

interface DocumentTableItemProps {
  data:
    | DocumentDataModel
    | PublishedTaxInvoiceResponseModel
    | ProjectResponseModel;
  onClick?: () => void;
  isTaxDocument?: boolean;
  isTransactionDocument?: boolean;
}

const DocumentTableItem = ({
  data,
  onClick,
  isTaxDocument = false,
  isTransactionDocument = false,
}: DocumentTableItemProps) => {
  const [isTaxPanelOpen, setIsTaxPanelOpen] = useState(false);
  const [isTransactionPanelOpen, setIsTransactionPanelOpen] = useState(false);
  const [projectStatusData, setProjectStatusData] =
    useState<ProjectStatusResponseModel | null>(null);

  const { getProjectStatus, isLoading: isProjectStatusLoading } =
    useGetProjectStatus();

  // 타입 가드 함수
  const isDocumentData = (
    item:
      | DocumentDataModel
      | PublishedTaxInvoiceResponseModel
      | ProjectResponseModel
  ): item is DocumentDataModel => {
    return 'documentType' in item;
  };

  const isTaxData = (
    item:
      | DocumentDataModel
      | PublishedTaxInvoiceResponseModel
      | ProjectResponseModel
  ): item is PublishedTaxInvoiceResponseModel => {
    return 'tax_invoice_type' in item; // sales, purchase
  };

  const isTransactionData = (
    item:
      | DocumentDataModel
      | PublishedTaxInvoiceResponseModel
      | ProjectResponseModel
  ): item is DocumentDataModel => {
    return 'documentType' in item && item.documentType === '거래명세서';
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

  // 거래명세서 클릭 핸들러
  const handleTransactionDocumentClick = () => {
    if (isTransactionDocument && isTransactionData(data)) {
      setIsTransactionPanelOpen(true);
    }
  };

  // 거래명세서 패널이 열릴 때 프로젝트 상태 데이터 가져오기
  useEffect(() => {
    const fetchProjectStatus = async () => {
      if (isTransactionPanelOpen && isTransactionData(data)) {
        const projectId = parseInt(data.id);
        const result = await getProjectStatus(projectId);
        if (result.success && result.data) {
          setProjectStatusData(result.data);
        }
      }
    };

    fetchProjectStatus();
  }, [isTransactionPanelOpen, data, getProjectStatus]);

  return (
    <>
      <div
        className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200"
        role="button"
        tabIndex={0}
        onClick={
          isTaxDocument
            ? handleTaxDocumentClick
            : isTransactionDocument
              ? handleTransactionDocumentClick
              : onClick
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (isTaxDocument) {
              handleTaxDocumentClick();
            } else if (isTransactionDocument) {
              handleTransactionDocumentClick();
            } else {
              onClick?.();
            }
          }
        }}
      >
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
              {data.transaction_date.split('T')[0] || '-'}
            </p>
            <p className="px-3 w-[150px]">
              {data.created_at.split('T')[0] || '-'}
            </p>
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
      {isTransactionPanelOpen && isTransactionData(data) && (
        <Panel
          title="거래명세서"
          onClose={() => setIsTransactionPanelOpen(false)}
        >
          {isProjectStatusLoading ? (
            <></>
          ) : projectStatusData && projectStatusData.quotations.length > 0 ? (
            <TransactionDocumentView
              quotationData={projectStatusData.quotations[0]}
              startDate={projectStatusData.quotations[0].due_date} // 납기일자로 임의로 설정
            />
          ) : (
            <></>
          )}
        </Panel>
      )}
    </>
  );
};

export default DocumentTableItem;
