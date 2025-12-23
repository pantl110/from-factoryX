import {
  PublishedTaxInvoiceResponseModel,
  ProjectResponseModel,
  WorkInstructionsResponseModel,
  CashReceiptResponseModel,
} from '@/types/data-model';
import { DocumentType, DocumentTypeColorMap } from './types';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTooltip } from '@/hooks';
import TaxDocumentView from './tax-document-view';
import TransactionDocumentView from './transaction-document-view';
import OrderDocumentView from './order-document-view';
import ProductionDocumentView from './production-document-view';
import ReceiptDetailPanel from '@/app/(with-layout)/tax/list/receipt/modals/receipt-detail-panel';
import {
  formatISODate,
  getLastDeliveryDate,
  getProductNames,
  getProductNamesDisplay,
} from '@/utils';
import { RoundChip, Tooltip, Panel } from '@/ui';

interface DocumentTableItemProps {
  data:
    | ProjectResponseModel
    | PublishedTaxInvoiceResponseModel
    | WorkInstructionsResponseModel
    | CashReceiptResponseModel;
  documentType: DocumentType;
}

const DocumentTableItem = ({ data, documentType }: DocumentTableItemProps) => {
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [isTransactionPanelOpen, setIsTransactionPanelOpen] = useState(false);
  const [isWorkInstructionPanelOpen, setIsWorkInstructionPanelOpen] =
    useState(false);
  const [isTaxPanelOpen, setIsTaxPanelOpen] = useState(false);
  const [isCashReceiptPanelOpen, setIsCashReceiptPanelOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({
    left: 0,
    top: 0,
  });
  const {
    isVisible: isClientTooltipVisible,
    onMouseEnter,
    onMouseLeave,
  } = useTooltip({ showDelay: 0, hideDelay: 0 });

  const { color } = DocumentTypeColorMap[documentType];

  const taxData = data as PublishedTaxInvoiceResponseModel;
  const projectData = data as ProjectResponseModel;
  const workInstructionData = data as WorkInstructionsResponseModel;
  const cashReceiptData = data as CashReceiptResponseModel;

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
    } else if (documentType === '현금영수증') {
      setIsCashReceiptPanelOpen(true);
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
            <div className="pl-2 pr-4 w-[150px]">
              <RoundChip
                text={documentType}
                variant="defaultSmall"
                color={color}
              />
            </div>
            <p
              className="px-3 flex-[1.5] truncate"
              title={taxData.client_info.name || '-'}
            >
              {taxData.client_info.name || '-'}
            </p>
            <p
              className="px-3 flex-[1.5] truncate"
              title={getProductNamesDisplay(
                taxData.line_items?.map((p) => p.name) || []
              )}
            >
              {getProductNamesDisplay(
                taxData.line_items?.map((p) => p.name) || []
              )}
            </p>
            <p
              className="px-3 flex-[1.5] truncate"
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
            <p className="px-3 flex-1">
              {formatISODate(taxData.transaction_date) || '-'}
            </p>
            <p className="px-3 flex-1">
              {formatISODate(taxData.created_at) || '-'}
            </p>
          </>
        ) : documentType === '현금영수증' ? (
          <>
            <div className="pl-2 pr-4 w-[150px]">
              <RoundChip
                text={documentType}
                variant="defaultSmall"
                color={color}
              />
            </div>
            <p
              className="px-3 flex-[1.5] truncate"
              title={cashReceiptData.client_name || '-'}
            >
              {cashReceiptData.client_name || '-'}
            </p>
            <p
              className="px-3 flex-[1.5] truncate"
              title={getProductNamesDisplay(
                cashReceiptData.item_name
                  ? cashReceiptData.item_name
                      .split(',')
                      .map((s: string) => s.trim())
                  : []
              )}
            >
              {getProductNamesDisplay(
                cashReceiptData.item_name
                  ? cashReceiptData.item_name
                      .split(',')
                      .map((s: string) => s.trim())
                  : []
              )}
            </p>
            <p
              className="px-3 flex-[1.5] truncate"
              title={cashReceiptData.total_amount?.toLocaleString() || '-'}
            >
              {cashReceiptData.total_amount?.toLocaleString() || '-'}
            </p>
            <p className="px-3 flex-1">
              {formatISODate(cashReceiptData.transaction_date) || '-'}
            </p>
          </>
        ) : documentType === '생산지시서' ? (
          <>
            <div className="pl-2 pr-4 flex-[0.5]">
              <RoundChip
                text={documentType}
                variant="defaultSmall"
                color={color}
              />
            </div>
            <div className="px-3 flex-1 flex items-center gap-2 truncate">
              {(() => {
                const clientNames = Array.from(
                  new Set(
                    (workInstructionData.plan_info &&
                    workInstructionData.plan_info.length > 0
                      ? workInstructionData.plan_info
                      : workInstructionData.plans || []
                    )
                      .map((plan) => plan.client_name)
                      .filter((name) => name)
                  )
                );

                if (clientNames.length === 0) {
                  return <span>-</span>;
                }

                if (clientNames.length === 1) {
                  return <span>{clientNames[0]}</span>;
                }

                return (
                  <>
                    <div
                      className="relative flex items-center gap-2"
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        // Chip 요소 찾기 (두 번째 자식 div 안의 div)
                        const chipContainer = e.currentTarget
                          .children[1] as HTMLElement;
                        const chipElement = chipContainer?.querySelector('div');
                        const rect = chipElement
                          ? chipElement.getBoundingClientRect()
                          : e.currentTarget.getBoundingClientRect();
                        setTooltipPosition({
                          left: rect.right - 40,
                          top: rect.bottom + 8,
                        });
                        onMouseEnter();
                      }}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        onMouseLeave();
                      }}
                    >
                      <span>{clientNames[0]}</span>
                      <div>
                        <RoundChip
                          text={`+${clientNames.length - 1}`}
                          variant="sm"
                          color="gray"
                        />
                      </div>
                    </div>
                    {isClientTooltipVisible &&
                      typeof window !== 'undefined' &&
                      createPortal(
                        <div
                          className="fixed w-fit z-10 pointer-events-none"
                          style={{
                            left: `${tooltipPosition.left}px`,
                            top: `${tooltipPosition.top}px`,
                          }}
                        >
                          <Tooltip
                            text={clientNames.slice(1).join(', ')}
                            color="black"
                            position="left"
                          />
                        </div>,
                        document.body
                      )}
                  </>
                );
              })()}
            </div>
            <p
              className="px-3 flex-1 truncate"
              title={
                getProductNamesDisplay(
                  (workInstructionData.plan_info &&
                  workInstructionData.plan_info.length > 0
                    ? workInstructionData.plan_info
                    : workInstructionData.plans || []
                  ).map((plan) => plan.product_name)
                ) || '-'
              }
            >
              {getProductNamesDisplay(
                (workInstructionData.plan_info &&
                workInstructionData.plan_info.length > 0
                  ? workInstructionData.plan_info
                  : workInstructionData.plans || []
                ).map((plan) => plan.product_name)
              ) || '-'}
            </p>
            <p
              className="px-3 flex-[0.5] truncate"
              title={formatISODate(workInstructionData.created_at) || '-'}
            >
              {formatISODate(workInstructionData.created_at) || '-'}
            </p>
          </>
        ) : projectData ? (
          <>
            <div className="pl-2 pr-4 flex-[0.5]">
              <RoundChip
                text={documentType}
                variant="defaultSmall"
                color={color}
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
                  ? formatISODate(projectData.pending_at) || '-'
                  : formatISODate(projectData.printed_at) || '-'
              }
            >
              {documentType === '주문서'
                ? formatISODate(projectData.pending_at) || '-'
                : formatISODate(projectData.printed_at) || '-'}
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
            supplyAmount={(() => {
              // 국세청 공식: 합계금액에서 공급가액 계산
              const totalAmount =
                projectData.quotations[0].products_info.reduce(
                  (acc, product) =>
                    acc + product.unit_price * product.quantity || 0,
                  0
                );
              // 국세청 공식: 공급가액 = 합계금액 ÷ 1.1
              return Math.floor(totalAmount / 1.1);
            })()}
            taxAmount={(() => {
              // 국세청 공식: 합계금액에서 공급가액과 세액 계산
              const totalAmount =
                projectData.quotations[0].products_info.reduce(
                  (acc, product) =>
                    acc + product.unit_price * product.quantity || 0,
                  0
                );
              // 국세청 공식: 공급가액 = 합계금액 ÷ 1.1, 세액 = 합계금액 - 공급가액
              const calculatedSupplyAmount = Math.floor(totalAmount / 1.1);
              return totalAmount - calculatedSupplyAmount;
            })()}
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
      {/* 현금영수증 디테일 판넬 */}
      {isCashReceiptPanelOpen && (
        <ReceiptDetailPanel
          itemId={cashReceiptData.id}
          onClose={() => setIsCashReceiptPanelOpen(false)}
        />
      )}
    </>
  );
};

export default DocumentTableItem;
