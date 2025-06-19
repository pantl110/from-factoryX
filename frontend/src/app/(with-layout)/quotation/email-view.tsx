import QuotationDocumentView from "@/app/(with-layout)/document/quotation-doument-view";
import MiniBtn from "@/ui/mini-btn";
import { X } from "@phosphor-icons/react/dist/ssr";

interface EmailViewProps {
  onClose?: () => void;
}

const EmailView = ({ onClose }: EmailViewProps) => {
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
          <h2 className="Heading-2">이메일로 견적서를 보내시겠어요?</h2>
          <div className="mt-2.5 Me_Body-3 text-gr">
            받는 사람과 제목을 확인한 후, 이메일을 전송해 주세요
          </div>
        </div>
        <MiniBtn
          text="견적서 보내기"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="bg-primary-hover"
        />
      </div>

      <QuotationDocumentView />
    </div>
  );
};

export default EmailView;
