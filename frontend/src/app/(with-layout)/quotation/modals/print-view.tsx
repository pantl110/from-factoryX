import MiniBtn from '@/ui/mini-btn';
import { X } from '@phosphor-icons/react/dist/ssr';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import QuotationDocumentView from '../../document/quotation-document-view/quotation-document-view';
import {
  ClientModel,
  QuotationProductDetailResponseModel,
} from '@/types/data-model';

interface PrintViewProps {
  onClose?: () => void;
  documentTitle: string;
  clientData: ClientModel;
  dueDate: string;
  productListInfoTitle: string;
  productItems: QuotationProductDetailResponseModel[];
  supplyAmount: number;
}

const PrintView = ({
  onClose,
  documentTitle,
  clientData,
  dueDate,
  productListInfoTitle,
  productItems,
  supplyAmount,
}: PrintViewProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: '견적서', // 문서 제목
  });

  return (
    <div className="w-full flex flex-col gap-6 px-8 pb-8">
      <div className="sticky pt-8 top-0 bg-wh">
        <div className="flex justify-between h-13 border-b border-lg">
          <h3 className="Heading-3">{documentTitle}</h3>
          <button
            className="w-10 h-10 flex justify-center items-center cursor-pointer rounded-[8px] hover:bg-bg transition-colors duration-200 ease-in-out"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="py-6 pt-6 w-full flex justify-between border-b border-lg">
          <div>
            <h2 className="Heading-2">{documentTitle}를 출력하시겠어요?</h2>
            <div className="mt-2.5 Me_Body-3 text-gr">
              출력 전, {documentTitle} 내용을 한 번 더 확인해 주세요.
            </div>
          </div>
          <MiniBtn
            text={`${documentTitle} 출력`}
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="hover:bg-primary-hover"
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
          supplyAmount={supplyAmount}
        />
      </div>
    </div>
  );
};

export default PrintView;
