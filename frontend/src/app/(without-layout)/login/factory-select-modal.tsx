import { useState } from 'react';
import Modal from '@/ui/modal/modal';
import { FactoriesResponseModel } from '@/types/data-model';
import MiniBtn from '@/ui/mini-btn';

interface FactorySelectModalProps {
  factories: FactoriesResponseModel[];
  onSelectFactory: (factoryId: number) => void;
  onClose: () => void;
}

const FactorySelectModal = ({
  factories,
  onSelectFactory,
  onClose,
}: FactorySelectModalProps) => {
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(
    null
  );

  const handleConfirm = () => {
    if (selectedFactoryId) {
      onSelectFactory(selectedFactoryId);
    }
  };

  return (
    <Modal
      sm={true}
      title="초대된 공장에 참여할까요?"
      subtitle={`현재 사용 중인 계정은 이미 다른 공장에 소속돼 있어요.
새로운 공장에 참여하면 기존 공장에서 자동으로 탈퇴돼요.`}
      onClose={onClose}
      width="w-[520px]"
      hideCloseIcon={true}
    >
      <div className="w-full flex justify-end gap-2.5 mt-4">
        <MiniBtn
          text="기존 공장 유지"
          textColor="text-sv"
          bgColor="bg-wh"
          hoverColor="hover:bg-bg"
          type="button"
        />
        <MiniBtn
          text="새 공장에 참여"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          type="submit"
        />
      </div>
    </Modal>
  );
};

export default FactorySelectModal;
