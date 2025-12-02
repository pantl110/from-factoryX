import DocumentViewTitle from '@/app/(with-layout)/document/document-view-title';
import MiniBtn from '@/ui/mini-btn';
import OverlayView from '@/ui/ovelay-view';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import DeliveryTableItem from './delivery-table-item';

interface DeliveryDataModel {
  companyName: string;
  productName: string;
  spec: string;
  unit: string;
  quantity: number;
}

interface DeliveryOverlayProps {
  onClose: () => void;
  data: DeliveryDataModel[];
}

const DeliveryOverlay = ({ onClose, data }: DeliveryOverlayProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: '납품표', // 문서 제목
  });

  return (
    <OverlayView onClose={onClose}>
      <div className="w-full flex flex-col gap-6 px-8 pb-8">
        <div className="pb-6 w-full flex justify-between border-b border-lg sticky pt-8 top-0 bg-wh">
          <div>
            <h2 className="Heading-2">납품표를 출력하시겠어요?</h2>
            <div className="mt-2.5 Me_Body-3 text-gr">
              출력 전, 납품서 내용을 한 번 더 확인해 주세요.
            </div>
          </div>
          <div className="flex gap-2.5">
            <MiniBtn
              text="취소"
              textColor="text-sv"
              hoverColor="hover:bg-bg"
              onClick={onClose}
            />
            <MiniBtn
              text="출력하기"
              textColor="text-wh"
              bgColor="bg-primary"
              hoverColor="hover:bg-primary-hover"
              onClick={reactToPrintFn}
            />
          </div>
        </div>
        <div ref={contentRef}>
          <div className="flex flex-col gap-6">
            {data.map((item, i) => {
              return (
                <div key={i} className="flex flex-col gap-3">
                  {data.length > 1 && (
                    <DocumentViewTitle title={`납품표 ${i + 1}`} />
                  )}
                  <DeliveryTableItem
                    data={item}
                    isLast={i === data.length - 1}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </OverlayView>
  );
};

export default DeliveryOverlay;
