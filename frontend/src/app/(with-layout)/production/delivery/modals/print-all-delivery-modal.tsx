import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal";

interface PrintAllDeliveryModalProps {
  onClose: () => void;
}

const PrintAllDeliveryModal = ({ onClose }: PrintAllDeliveryModalProps) => {
  return (
    <Modal
      title="납품표를 일괄 출력하시겠습니까?"
      subtitle="선택한 항목에 대한 납품 정보를 출력합니다."
      sm={true}
      onClose={onClose}
      width="w-[487px]"
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text="취소하기" borderColor="border-lg" onClick={onClose} />
        <MiniBtn
          text="출력하기"
          bgColor="bg-primary"
          textColor="text-white"
          hoverColor="hover:bg-primary-hover"
          onClick={onClose}
        />
      </div>
    </Modal>
  );
};

export default PrintAllDeliveryModal;
