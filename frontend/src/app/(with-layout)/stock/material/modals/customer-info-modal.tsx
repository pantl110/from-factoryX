import Modal from "@/ui/modal/modal";
import CustomerInfo from "../material-detail/customer-info";

interface CustomerInfoModalProps {
  onClose: () => void;
}

const CustomerInfoModal = ({ onClose }: CustomerInfoModalProps) => {
  return (
    <Modal title="거래처 정보" onClose={onClose} width="w-[947px]">
      <div className="mt-3">
        <CustomerInfo />
      </div>
    </Modal>
  );
};

export default CustomerInfoModal;
