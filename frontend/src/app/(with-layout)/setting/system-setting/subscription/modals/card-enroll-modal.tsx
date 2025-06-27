import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";
import { QuestionIcon } from "@phosphor-icons/react/dist/ssr";

interface CardEnrollModalProps {
  onClose: () => void;
}

const CardEnrollModal = ({ onClose }: CardEnrollModalProps) => {
  return (
    <Modal
      title="사용하실 결제 카드를 등록해주세요."
      onClose={onClose}
      width="w-[586px]"
    >
      <div className="flex flex-col gap-1">
        <p className="Me_Body-2 text-gr">
          등록된 카드는 이후 결제 단계에서 선택하실 수 있어요.
        </p>
      </div>
      <div className="flex flex-col gap-3 mt-2">
        <div className="flex flex-col gap-2">
          <div className="flex gap-1 justify-start items-center">
            <h6 className="Heading-5 text-dg">카드 번호</h6>
            <h6 className="Heading-5 text-primary">*</h6>
          </div>
          <div className="flex w-full gap-2">
            <div className="flex gap-2 px-3 items-center justify-center h-12 flex-1  rounded-sm bg-bg border-[#e4e4e7] border">
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
            </div>
            <div className="flex gap-2 px-3 items-center justify-center h-12 flex-1  rounded-sm bg-bg border-[#e4e4e7] border">
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
            </div>
            <div className="flex gap-2 px-3 items-center justify-center h-12 flex-1  rounded-sm bg-bg border-[#e4e4e7] border">
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
            </div>
            <div className="flex gap-2 px-3 items-center justify-center h-12 flex-1  rounded-sm bg-bg border-[#e4e4e7] border">
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-1 justify-start items-center">
            <h6 className="Heading-5 text-dg">만료일</h6>
            <h6 className="Heading-5 text-primary">*</h6>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-2 px-3 items-center justify-center h-12 w-32 rounded-sm bg-bg border-[#e4e4e7] border">
              <p className="Re_Body-1 text-gr">MM/YY</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-1 justify-start items-center">
            <h6 className="Heading-5 text-dg">보안코드(CVX/CVV)</h6>
            <h6 className="Heading-5 text-primary">*</h6>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-2 px-3 items-center justify-center h-12 w-24 rounded-sm bg-bg border-[#e4e4e7] border">
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
              <div className="rounded-full bg-gr w-1.5 h-1.5" />
            </div>
            <QuestionIcon size={28} className="text-gr" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-1 justify-start items-center">
            <h6 className="Heading-5 text-dg">카드 비밀번호</h6>
            <h6 className="Heading-5 text-primary">*</h6>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center justify-center h-12 w-12 rounded-sm bg-bg border-[#e4e4e7] border">
              <div className="rounded-full bg-gr w-2 h-2" />
            </div>
            <div className="flex items-center justify-center h-12 w-12 rounded-sm bg-bg border-[#e4e4e7] border">
              <div className="rounded-full bg-gr w-2 h-2" />
            </div>
            <div className="flex items-center justify-center h-12 w-12 rounded-sm bg-bg border-[#e4e4e7] border">
              <div className="rounded-full bg-gr w-2 h-2" />
            </div>
            <div className="flex items-center justify-center h-12 w-12 rounded-sm bg-bg border-[#e4e4e7] border">
              <div className="rounded-full bg-gr w-2 h-2" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <MiniBtn
          text="취소하기"
          textColor="text-sv"
          onClick={onClose}
          hoverColor=""
        />
        <MiniBtn
          text="추가하기"
          bgColor="bg-wh"
          textColor="text-primary"
          hoverColor="hover:bg-primary-hover"
          disabled={true}
        />
      </div>
    </Modal>
  );
};

export default CardEnrollModal;
