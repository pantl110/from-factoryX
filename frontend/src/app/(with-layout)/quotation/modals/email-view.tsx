import MiniBtn from "@/ui/mini-btn";
import { PaperPlaneTilt, X } from "@phosphor-icons/react/dist/ssr";
import OrderDocumentView from "../../document/order-document-view";

interface EmailViewProps {
  onClose?: () => void;
}

const EmailView = ({ onClose }: EmailViewProps) => {
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
            <h2 className="Heading-2">이메일로 견적서를 보내시겠어요?</h2>
            <div className="mt-2.5 Me_Body-3 text-gr">
              받는 사람과 정보를 확인한 후, 이메일을 전송해 주세요.
            </div>
          </div>
          <MiniBtn
            text="견적서 보내기"
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="hover:bg-primary-hover"
            icon={PaperPlaneTilt}
          />
        </div>
      </div>

      <OrderDocumentView />
    </div>
  );
};

export default EmailView;
