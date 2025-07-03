import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";

interface SaveModalProps {
  onClose: () => void;
}

const SaveModal = ({ onClose }: SaveModalProps) => {
  return (
    <Modal
      onClose={onClose}
      title="저장이 완료되었습니다."
      subtitle="변경하신 내용이 정상적으로 저장되었습니다."
      sm={true}
    >
      <div className="flex justify-end mt-4 gap-[5px]">
        <MiniBtn
          text="닫기"
          textColor="text-sv"
          hoverColor=""
          onClick={onClose}
        />
        <MiniBtn
          text="확인"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          onClick={onClose}
        />
      </div>
    </Modal>
  );
};

export default SaveModal;
