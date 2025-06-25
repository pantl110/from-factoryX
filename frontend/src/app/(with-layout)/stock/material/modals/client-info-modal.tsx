import MiniBtn from "@/ui/mini-btn";
import Input from "@/ui/input";
import Modal from "@/ui/modal";

interface ClientInfoModalProps {
  onClose?: () => void;
  onNext?: () => void;
}

const ClientInfoModal = ({ onClose, onNext }: ClientInfoModalProps) => {
  return (
    <Modal
      title="거래처 정보를 입력해주세요."
      subtitle="등록된 정보는 이후 문서 작성 시 자동으로 불러와져요."
      onClose={onClose}
      width="w-[586px]"
    >
      <div className="flex flex-col gap-7 mt-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2.5">
            <Input label="거래처명" placeholder="거래처명 입력" required />
            <Input
              label="사업자등록번호"
              placeholder="사업자등록번호 입력"
              required
            />
          </div>
          <div className="flex gap-2.5">
            <Input label="대표자명" placeholder="대표자명 입력" required />
            <Input label="담당자 이메일" placeholder="담당자 이메일 입력" />
          </div>
          <div className="flex gap-2.5">
            <Input label="담당자 연락처" placeholder="담당자 연락처 입력" />
            <Input label="팩스 번호" placeholder="팩스 번호 입력" />
          </div>
          <div className="flex gap-2.5">
            <Input label="업태" placeholder="업태 입력" required />
            <Input label="종목" placeholder="종목 입력" required />
          </div>
          <div className="flex gap-2.5">
            <Input label="사업장 주소" placeholder="사업장 주소 입력" />
          </div>
        </div>
        <div className="flex justify-end gap-2.5">
          <MiniBtn
            text="취소하기"
            textColor="text-sv"
            onClick={onClose}
            hoverColor=""
          />
          <MiniBtn
            text="다음 단계"
            bgColor="bg-primary"
            textColor="text-wh"
            onClick={onNext}
            hoverColor="hover:bg-primary-hover"
          />
        </div>
      </div>
    </Modal>
  );
};

export default ClientInfoModal;
