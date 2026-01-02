import { X } from '@phosphor-icons/react/dist/ssr';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import QuotationDocumentView from '../../document/quotation-document-view/quotation-document-view';
import {
  ClientModel,
  QuotationProductDetailResponseModel,
} from '@/types/data-model';
import { IconBtn, MiniBtn } from '@/ui';
import { useTranslations } from 'next-intl';

interface PrintViewProps {
  onClose?: () => void;
  documentTitle: string;
  clientData: ClientModel;
  dueDate: string;
  productListInfoTitle: string;
  productItems: QuotationProductDetailResponseModel[];
}

const PrintView = ({
  onClose,
  documentTitle,
  clientData,
  dueDate,
  productListInfoTitle,
  productItems,
}: PrintViewProps) => {
  const t = useTranslations('quotation.printView');
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: `${documentTitle}`, // 문서 제목
  });

  // 국세청 공식: 합계금액에서 공급가액과 세액 계산
  // productItems의 합계금액 계산
  const totalAmount = productItems.reduce((sum, item) => {
    // supply_amount와 tax_amount가 모두 있으면 합계금액으로 사용
    if (
      item.supply_amount !== null &&
      item.supply_amount !== undefined &&
      item.tax_amount !== null &&
      item.tax_amount !== undefined
    ) {
      return sum + item.supply_amount + item.tax_amount;
    }
    // 없으면 quantity * unit_price를 합계금액(세금 포함)으로 간주
    return sum + (item.quantity || 0) * (item.unit_price || 0);
  }, 0);

  // 국세청 공식: 공급가액 = 합계금액 ÷ 1.1, 세액 = 합계금액 - 공급가액
  const calculatedSupplyAmount = Math.floor(totalAmount / 1.1);
  const calculatedTaxAmount = totalAmount - calculatedSupplyAmount;

  return (
    <div className="w-full flex flex-col gap-6 px-8 pb-8">
      <div className="sticky pt-8 top-0 bg-wh">
        <div className="flex justify-between h-13 border-b border-lg">
          <h3 className="Heading-3">{documentTitle}</h3>
          <IconBtn icon={X} onClick={onClose || (() => {})} />
        </div>

        <div className="py-6 pt-6 w-full flex justify-between border-b border-lg">
          <div>
            <h2 className="Heading-2">{t('printTitle', { documentTitle })}</h2>
            <div className="mt-2.5 Me_Body-3 text-gr">
              {t('printDescription', { documentTitle })}
            </div>
          </div>
          <MiniBtn
            text={t('printButton', { documentTitle })}
            variant="primary"
            onClick={reactToPrintFn}
          />
        </div>
      </div>

      <div ref={contentRef}>
        <QuotationDocumentView
          documentTitle={documentTitle}
          clientData={clientData}
          dueDate={dueDate}
          productListInfoTitle={productListInfoTitle}
          productItems={productItems}
          supplyAmount={calculatedSupplyAmount}
          taxAmount={calculatedTaxAmount}
        />
      </div>
    </div>
  );
};

export default PrintView;
