import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useTranslations } from 'next-intl';

interface CardDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const CardDeleteModal = ({ onClose, onConfirm }: CardDeleteModalProps) => {
  const t = useTranslations(
    'setting.systemSetting.subscription.cardDeleteModal'
  );
  const tCommon = useTranslations('common');

  return (
    <Modal title={t('title')} subtitle={t('subtitle')} onClose={onClose}>
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text={tCommon('cancel')} variant="white" onClick={onClose} />
        <MiniBtn text={tCommon('delete')} variant="red" onClick={onConfirm} />
      </div>
    </Modal>
  );
};

export default CardDeleteModal;
