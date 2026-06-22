'use client';

import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useTranslations } from 'next-intl';

interface CancelSubscriptionModalProps {
  planTitle: string;
  onClose: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CancelSubscriptionModal = ({
  planTitle,
  onClose,
  onCancel,
  isLoading,
}: CancelSubscriptionModalProps) => {
  const t = useTranslations('setting.systemSetting.subscription.cancelModal');
  const tCommon = useTranslations('common');

  return (
    <Modal
      title={t('title', { planTitle })}
      subtitle={t('subtitle')}
      onClose={onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text={tCommon('cancel')} variant="gray" onClick={onClose} />
        <MiniBtn
          text={t('unsubscribeButton')}
          variant="primary"
          onClick={onCancel}
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default CancelSubscriptionModal;
