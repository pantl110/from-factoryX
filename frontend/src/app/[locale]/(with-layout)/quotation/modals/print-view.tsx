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

  const calculatedSupplyAmount = productItems.reduce((sum, item) => {
    if (item.supply_amount !== null && item.supply_amount !== undefined) {
      return sum + item.supply_amount;
    }
    return sum + (item.quantity || 0) * (item.unit_price || 0);
  }, 0);
  const calculatedTaxAmount = calculatedSupplyAmount * 0.1;

  return (
    <div className="w-full flex flex-col gap-6 px-8 pb-8">
      <div className="sticky pt-8 top-0 z-10 bg-wh">
        <div className="flex justify-between h-13 border-b border-lg">
          <h3 className="Heading-3">{documentTitle}</h3>
          <IconBtn icon={X} onClick={onClose || (() => {})} />
        </div>

        <div className="py-6 pt-6 w-full flex justify-between border-b border-lg">
          <div>
            <h2 className="Heading-2">{t('printTitle', { documentTitle })}</h2>
            <div className="mt-2.5 Me_Body-1 text-gr">
              {t('printDescription', { documentTitle })}
            </div>
          </div>
          <MiniBtn
            text={t('printButton', { documentTitle })}
            variant="secondary"
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
