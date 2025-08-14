import TransactionDocumentView from '@/app/(with-layout)/document/transaction-document-view';
import { QuotationResponseModel } from '@/types/data-model';
import MiniBtn from '@/ui/mini-btn';
import OverlayView from '@/ui/ovelay-view';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface CreateTransactionOverlayviewProps {
  onClose: () => void;
  quotationData: QuotationResponseModel;
  startDate: string;
}

const CreateTransactionOverlayview = ({
  onClose,
  quotationData,
  startDate,
}: CreateTransactionOverlayviewProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: `거래명세서`, // 문서 제목
  });

  return (
    <OverlayView onClose={onClose}>
      <div className="w-full flex flex-col gap-6 px-8 pb-8">
        <div className="pb-6 w-full flex justify-between border-b border-lg sticky pt-8 top-0 bg-wh z-10">
          <div>
            <h2 className="Heading-2">거래명세서를 출력하시겠어요?</h2>
            <div className="mt-2.5 Me_Body-3 text-gr">
              출력 전, 거래명세서 내용을 한 번 더 확인해 주세요.
            </div>
          </div>
          <div className="flex gap-2.5">
            <MiniBtn
              text="취소"
              textColor="text-sv"
              onClick={onClose}
              hoverColor=""
            />
            <MiniBtn
              text="거래명세서 출력"
              textColor="text-wh"
              bgColor="bg-primary"
              hoverColor="hover:bg-primary-hover"
              onClick={reactToPrintFn}
            />
          </div>
        </div>

        <div ref={contentRef}>
          <TransactionDocumentView
            quotationData={quotationData}
            startDate={startDate}
          />
        </div>
      </div>
    </OverlayView>
  );
};

export default CreateTransactionOverlayview;
