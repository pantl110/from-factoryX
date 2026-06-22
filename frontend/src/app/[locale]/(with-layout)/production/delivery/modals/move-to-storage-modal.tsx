'use client';

import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface MoveToStorageModalProps {
  onClose: () => void;
  onMoveToStorage: () => void;
  isLoading?: boolean;
}

const MoveToStorageModal = ({
  onClose,
  onMoveToStorage,
  isLoading = false,
}: MoveToStorageModalProps) => {
  const t = useTranslations('production.delivery.moveToStorage');
  const tCommon = useTranslations('common');

  return (
    <Modal title={t('title')} onClose={onClose} subtitle={t('subtitle')}>
      <div className="flex gap-2.5 mt-4 justify-end">
        <MiniBtn variant="white"
          text={tCommon('cancel')}
          onClick={onClose}
        />
        <MiniBtn variant="secondary"
          text={t('button')}
          onClick={onMoveToStorage}
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default MoveToStorageModal;
