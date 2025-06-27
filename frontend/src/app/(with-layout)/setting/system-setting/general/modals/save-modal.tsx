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
      width="w-[487px]"
    >
      <div className="flex justify-end">
        <MiniBtn
          text="확인"
          textColor="text-primary"
          bgColor="bg-primary-8"
          hoverColor="hover:bg-secondary-hover"
          onClick={onClose}
        />
      </div>
    </Modal>
  );
};

export default SaveModal;
