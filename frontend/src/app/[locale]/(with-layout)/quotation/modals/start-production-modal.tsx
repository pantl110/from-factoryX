import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useTranslations } from 'next-intl';

interface StartProductionModalProps {
  onClose: () => void;
  onClick: () => void;
  isLoading?: boolean;
}

const StartProductionModal = ({
  onClose,
  onClick,
  isLoading = false,
}: StartProductionModalProps) => {
  const t = useTranslations('quotation.startProductionModal');
  const tCommon = useTranslations('common');

  return (
    <Modal onClose={onClose} title={t('title')} subtitle={t('subtitle')}>
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn
          text={tCommon('cancel')}
          textColor="text-sv"
          onClick={onClose}
          hoverColor="hover:bg-bg"
        />
        <MiniBtn
          text={t('startButton')}
          textColor="text-wh"
          bgColor="bg-primary"
          onClick={onClick}
          hoverColor="hover:bg-primary-hover"
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default StartProductionModal;
