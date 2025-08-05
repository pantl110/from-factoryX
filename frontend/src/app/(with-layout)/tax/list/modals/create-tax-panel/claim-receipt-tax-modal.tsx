import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useState } from 'react';

interface ClaimReceiptTaxModalProps {
  onClose: () => void;
  issueType: '청구' | '영수';
  onConfirm?: () => void;
}

const ClaimReceiptTaxModal = ({
  onClose,
  issueType,
}: ClaimReceiptTaxModalProps) => {
  const [isNextModalOpen, setIsNextModalOpen] = useState(false);

  const getTitle = () => {
    return `${issueType} 방식으로 세금계산서를 생성할까요?`;
  };

  const getSubtitle = () => {
    return `${issueType} 방식으로 발행된 세금계산서는 문서 뷰에 '${issueType}'로 표시돼요.`;
  };

  const handleConfirm = () => {
    setIsNextModalOpen(true); // 다음 모달 보여주기
  };

  return (
    <>
      <Modal
        title={getTitle()}
        subtitle={getSubtitle()}
        onClose={onClose}
        sm={true}
      >
        <div className="flex justify-end gap-[5px] mt-4">
          <MiniBtn
            text="취소"
            textColor="text-sv"
            hoverColor=""
            onClick={onClose}
          />
          <MiniBtn
            text="확인"
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="hover:bg-primary-hover"
            onClick={handleConfirm}
          />
        </div>
      </Modal>

      {/* 다음 모달 */}
      {isNextModalOpen && (
        <Modal
          title="세금계산서가 선택한 방식으로 생성되었어요."
          subtitle="생성된 세금계산서는 문서 형식으로 확인하실 수 있어요."
          onClose={() => setIsNextModalOpen(false)}
          sm={true}
        >
          <div className="flex justify-end gap-[5px] mt-4">
            <MiniBtn
              text="취소"
              textColor="text-sv"
              hoverColor=""
              onClick={() => setIsNextModalOpen(false)}
            />
            <MiniBtn
              text="확인"
              textColor="text-wh"
              bgColor="bg-primary"
              hoverColor="hover:bg-primary-hover"
              onClick={() => {
                setIsNextModalOpen(false);
                onClose(); // 모든 모달 닫기
              }}
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default ClaimReceiptTaxModal;
