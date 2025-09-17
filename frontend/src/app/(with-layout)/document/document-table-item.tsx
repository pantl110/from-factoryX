import {
  PublishedTaxInvoiceResponseModel,
  ProjectResponseModel,
  WorkInstructionsResponseModel,
} from '@/types/data-model';
import Chip from '@/ui/chip';
import { DocumentType, DocumentTypeColorMap } from './types';
import { useState } from 'react';
import Panel from '@/ui/panel';
import TaxDocumentView from './tax-document-view';
import {
  getProductNames,
  getProductNamesDisplay,
} from '@/utils/get-product-names-display';
import TransactionDocumentView from './transaction-document-view';
import getLastDeliveryDate from '@/utils/get-last-delivery-date';
import OrderDocumentView from './order-document-view';
import ProductionDocumentView from './production-document-view';

interface DocumentTableItemProps {
  data:
    | ProjectResponseModel
    | PublishedTaxInvoiceResponseModel
    | WorkInstructionsResponseModel;
  documentType: DocumentType;
}

const DocumentTableItem = ({ data, documentType }: DocumentTableItemProps) => {
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [isTransactionPanelOpen, setIsTransactionPanelOpen] = useState(false);
  const [isWorkInstructionPanelOpen, setIsWorkInstructionPanelOpen] =
    useState(false);
  const [isTaxPanelOpen, setIsTaxPanelOpen] = useState(false);

  const { bgColor, textColor } = DocumentTypeColorMap[documentType];

  const taxData = data as PublishedTaxInvoiceResponseModel;
  const projectData = data as ProjectResponseModel;
  const workInstructionData = data as WorkInstructionsResponseModel;

  // 항목 클릭 시
  const handleItemClick = () => {
    if (documentType === '주문서') {
      setIsOrderPanelOpen(true);
    } else if (documentType === '거래명세서') {
      setIsTransactionPanelOpen(true);
    } else if (documentType === '생산지시서') {
      setIsWorkInstructionPanelOpen(true);
    } else if (
      documentType === '매출 세금계산서' ||
      documentType === '매입 세금계산서'
    ) {
      setIsTaxPanelOpen(true);
    }
  };

  return (
    <>
      <div
        className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-pointer hover:bg-bg transition-colors duration-200"
        role="button"
        tabIndex={0}
        onClick={handleItemClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleItemClick();
          }
        }}
      >
        {documentType === '매출 세금계산서' ||
        documentType === '매입 세금계산서' ? (
          <>
            <p
              className="px-3 flex-1 truncate"
              title={taxData.client_info.name || '-'}
            >
              {taxData.client_info.name || '-'}
            </p>
            <p
              className="px-3 flex-1 truncate"
              title={getProductNamesDisplay(
                taxData.products_info?.map((p) => p.name) || []
              )}
            >
              {getProductNamesDisplay(
                taxData.products_info?.map((p) => p.name) || []
              )}
            </p>
            <p
              className="px-3 flex-1 truncate"
              title={taxData.transaction_amount?.toLocaleString() || '-'}
            >
              {taxData.transaction_amount?.toLocaleString() || '-'}
            </p>
            <p
              className="px-3 flex-1 truncate"
              title={taxData.tax_amount?.toLocaleString() || '-'}
            >
              {taxData.tax_amount?.toLocaleString() || '-'}
            </p>
            <p
              className="px-3 flex-1 truncate"
              title={
                (
                  taxData.transaction_amount + taxData.tax_amount
                )?.toLocaleString() || '-'
              }
            >
              {(
                taxData.transaction_amount + taxData.tax_amount
              )?.toLocaleString() || '-'}
            </p>
            <p className="px-3 w-[150px]">
              {taxData.transaction_date?.split('T')[0] || '-'}
            </p>
            <p className="px-3 w-[150px]">
              {taxData.created_at?.split('T')[0] || '-'}
            </p>
          </>
        ) : documentType === '생산지시서' ? (
          <>
            <div className="px-3 flex-[0.5]">
              <Chip
                text={documentType}
                bgColor={bgColor}
                textColor={textColor}
              />
            </div>
            <p
              className="px-3 flex-1 truncate"
              title={
                getProductNamesDisplay(
                  workInstructionData.plans.map((plan) => plan.client_name)
                ) ?? '-'
              }
            >
              {getProductNamesDisplay(
                workInstructionData.plans.map((plan) => plan.client_name)
              ) ?? '-'}
            </p>
            <p
              className="px-3 flex-1 truncate"
              title={
                getProductNamesDisplay(
                  (workInstructionData?.plans || []).map(
                    (plan) => plan.product_name
                  )
                ) || '-'
              }
            >
              {getProductNamesDisplay(
                (workInstructionData?.plans || []).map(
                  (plan) => plan.product_name
                )
              ) || '-'}
            </p>
            <p
              className="px-3 flex-[0.5] truncate"
              title={workInstructionData.created_at?.split('T')[0] || '-'}
            >
              {workInstructionData.created_at?.split('T')[0] || '-'}
            </p>
          </>
        ) : projectData ? (
          <>
            <div className="px-3 flex-[0.5]">
              <Chip
                text={documentType}
                bgColor={bgColor}
                textColor={textColor}
              />
            </div>
            <p
              className="px-3 flex-1 truncate"
              title={projectData.quotations[0].client_info.name || '-'}
            >
              {projectData.quotations[0].client_info.name || '-'}
            </p>
            <p
              className="px-3 flex-1 truncate"
              title={getProductNames(projectData) || '-'}
            >
              {getProductNames(projectData) || '-'}
            </p>
            <p
              className="px-3 flex-[0.5] truncate"
              title={
                documentType === '주문서'
                  ? projectData.confirmed_at?.split('T')[0] || '-'
                  : projectData.printed_at?.split('T')[0] || '-'
              }
            >
              {documentType === '주문서'
                ? projectData.confirmed_at?.split('T')[0] || '-'
                : projectData.printed_at?.split('T')[0] || '-'}
            </p>
          </>
        ) : null}
      </div>

      {/* 주문서 디테일 판넬 */}
      {isOrderPanelOpen && (
        <Panel title="주문서" onClose={() => setIsOrderPanelOpen(false)}>
          <OrderDocumentView
            documentTitle="주문서"
            clientData={projectData.quotations[0].client_info}
            dueDate={projectData.quotations[0].due_date}
            productListInfoTitle="주문 품목 정보"
            productItems={projectData.quotations[0].products_info.map(
              (product) => ({
                productId: product.id,
                product_code: product.code,
                product_name: product.name,
                spec: product.spec,
                unit: product.unit,
                quantity: product.quantity,
                unit_price: product.unit_price,
                supply_amount: product.unit_price * product.quantity,
                tax_amount: product.unit_price * product.quantity * 0.1,
              })
            )}
            supplyAmount={projectData.quotations[0].products_info.reduce(
              (acc, product) =>
                acc + product.unit_price * product.quantity || 0,
              0
            )}
          />
        </Panel>
      )}
      {/* 생산지시서 디테일 판넬 */}
      {isWorkInstructionPanelOpen && (
        <Panel
          title="생산지시서"
          onClose={() => setIsWorkInstructionPanelOpen(false)}
        >
          <ProductionDocumentView
            workInstructioId={workInstructionData.id}
            isOnlyRead={true}
          />
        </Panel>
      )}
      {/* 거래명세서 디테일 판넬 */}
      {isTransactionPanelOpen && (
        <Panel
          title="거래명세서"
          onClose={() => setIsTransactionPanelOpen(false)}
        >
          {projectData && projectData.quotations.length > 0 ? (
            <TransactionDocumentView
              quotationData={projectData.quotations[0]}
              lastDeliveryDate={getLastDeliveryDate(projectData.quotations[0])}
            />
          ) : (
            <></>
          )}
        </Panel>
      )}
      {/* 세금계산서 디테일 판넬  */}
      {isTaxPanelOpen && (
        <Panel
          title={
            taxData.tax_invoice_type === 'sales'
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
