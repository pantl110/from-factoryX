import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";

interface DeleteTeamMemberModalProps {
  onClose: () => void;
}

const DeleteTeamMemberModal = ({ onClose }: DeleteTeamMemberModalProps) => {
  return (
    <Modal
      title="해당 팀원을 삭제하시겠어요?"
      subtitle={
        "삭제하시면 해당 팀원은 더 이상 팩토리엑스를 이용할 수 없게 돼요."
      }
      onClose={onClose}
      sm={true}
    >
      <div className="flex justify-end mt-4 gap-[5px]">
        <MiniBtn
          text="닫기"
          textColor="text-sv"
          onClick={onClose}
          hoverColor=""
        />
        <MiniBtn
          text="삭제하기"
          textColor="text-red"
          bgColor="bg-red-8"
          onClick={onClose}
          hoverColor="hover:bg-red-hover "
        />
      </div>
    </Modal>
  );
};

export default DeleteTeamMemberModal;
