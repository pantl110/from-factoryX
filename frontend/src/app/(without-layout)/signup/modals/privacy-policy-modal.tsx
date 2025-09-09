import Modal from '@/ui/modal/modal';

const PrivacyPolicyModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <Modal
      title="개인정보 수집 및 이용 동의"
      onClose={onClose}
      width="w-[947px]"
      scroll={true}
    >
      <div className="px-6">
        <div>수집 항목</div>
      </div>
    </Modal>
  );
};

export default PrivacyPolicyModal;
