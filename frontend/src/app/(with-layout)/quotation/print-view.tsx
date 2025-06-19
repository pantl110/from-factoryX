import QuotationDocumentView from "@/app/(with-layout)/document/quotation-doument-view";
import MiniBtn from "@/ui/mini-btn";
import { X } from "@phosphor-icons/react/dist/ssr";

interface PrintViewProps {
  onClose?: () => void;
}

const PrintView = ({ onClose }: PrintViewProps) => {
  return (
    <div className="w-full flex flex-col gap-6 p-8">
      <div className="flex justify-between h-13 border-b border-lg">
        <h3 className="Heading-3">견적서</h3>
        <button
          className="w-10 h-10 flex justify-center items-center cursor-pointer"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <div className="pb-6 w-full flex justify-between border-b border-lg">
        <div>
          <h2 className="Heading-2">견적서를 출력하시겠어요?</h2>
          <div className="mt-2.5 Me_Body-3 text-gr">
            출력 전 견적서 내용을 한번 더 확인해 주세요.
          </div>
        </div>
        <MiniBtn
          text="견적서 출력하기"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="bg-primary-hover"
        />
      </div>

      <QuotationDocumentView />
    </div>
  );
};

export default PrintView;
