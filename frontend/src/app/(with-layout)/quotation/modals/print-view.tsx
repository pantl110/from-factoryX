import MiniBtn from "@/ui/mini-btn";
import { PrinterIcon, X } from "@phosphor-icons/react/dist/ssr";
import QuotationDocumentView from "../../document/order-document-view/quotation-document-view";

interface PrintViewProps {
  onClose?: () => void;
}

const PrintView = ({ onClose }: PrintViewProps) => {
  return (
    <div className="w-full flex flex-col gap-6 px-8 pb-8">
      <div className="sticky pt-8 top-0 bg-wh">
        <div className="flex justify-between h-13 border-b border-lg">
          <h3 className="Heading-3">견적서</h3>
          <button
            className="w-10 h-10 flex justify-center items-center cursor-pointer rounded-[8px] hover:bg-bg transition-colors duration-200 ease-in-out"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="py-6 w-full flex justify-between border-b border-lg">
          <div>
            <h2 className="Heading-2">견적서를 출력하시겠어요?</h2>
            <div className="mt-2.5 Me_Body-3 text-gr">
              출력 전 견적서 내용을 한 번 더 확인해 주세요.
            </div>
          </div>
          <MiniBtn
            text="견적서 출력하기"
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="hover:bg-primary-hover"
            icon={PrinterIcon}
            iconColor="text-wh"
          />
        </div>
      </div>
      <QuotationDocumentView />
    </div>
  );
};

export default PrintView;
