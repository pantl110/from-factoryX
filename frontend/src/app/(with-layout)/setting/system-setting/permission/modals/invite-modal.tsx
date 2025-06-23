import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

interface InviteModalProps {
  onClose: () => void;
}

const InviteModal = ({ onClose }: InviteModalProps) => {
  return (
    <Modal
      title="팩토리엑스에 팀원을 초대하세요."
      subtitle="초대할 분의 이메일과 권한을 설정해주세요."
      onClose={onClose}
      width="w-[586px]"
    >
      <div className="flex gap-2.5 w-full mt-4">
        <div className="flex-1">
          <Input placeholder="이메일을 입력하세요." />
        </div>
        <MiniBtn
          text="권한"
          textColor="text-dg"
          borderColor="border-lg"
          icon={CaretDown}
          iconPosition="right"
          height="h-12"
        />
      </div>

      <div className="flex mt-5 justify-end gap-2.5">
        <MiniBtn text="취소하기" textColor="text-sv" />
        <MiniBtn text="초대하기" textColor="text-wh" bgColor="bg-primary" />
      </div>
    </Modal>
  );
};

export default InviteModal;
