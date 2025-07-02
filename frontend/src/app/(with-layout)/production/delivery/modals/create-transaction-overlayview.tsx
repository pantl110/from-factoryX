import TransactionDocumentView from "@/app/(with-layout)/document/transaction-document-view";
import MiniBtn from "@/ui/mini-btn";
import OverlayView from "@/ui/ovelay-view";

interface CreateTransactionOverlayviewProps {
  onClose: () => void;
}

const CreateTransactionOverlayview = ({
  onClose,
}: CreateTransactionOverlayviewProps) => {
  return (
    <OverlayView onClose={onClose}>
      <div className="w-full flex flex-col gap-6 px-8 pb-8">
        <div className="pb-6 w-full flex justify-between border-b border-lg sticky pt-8 top-0 bg-wh z-10">
          <div>
            <h2 className="Heading-2">이메일로 거래명세서를 보내시겠어요?</h2>
            <div className="mt-2.5 Me_Body-3 text-gr">
              받는 사람과 정보를 확인한 후, 이메일을 전송해 주세요.
            </div>
          </div>
          <div className="flex gap-2.5">
            <MiniBtn
              text="취소하기"
              textColor="text-sv"
              onClick={onClose}
              hoverColor=""
            />
            <MiniBtn
              text="이메일 보내기"
              textColor="text-wh"
              bgColor="bg-primary"
              hoverColor="hover:bg-primary-hover"
            />
          </div>
        </div>

        <TransactionDocumentView />
      </div>
    </OverlayView>
  );
};

export default CreateTransactionOverlayview;
