import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useTranslations } from 'next-intl';

interface CardChangeModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const CardChangeModal = ({ onClose, onConfirm }: CardChangeModalProps) => {
  const t = useTranslations(
    'setting.systemSetting.subscription.cardChangeModal'
  );
  const tCommon = useTranslations('common');

  return (
    <Modal title={t('title')} subtitle={t('subtitle')} onClose={onClose}>
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text={tCommon('cancel')} variant="white" onClick={onClose} />
        <MiniBtn
          text={t('changeButton')}
          variant="primary"
          onClick={onConfirm}
        />
      </div>
    </Modal>
  );
};

export default CardChangeModal;
