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
        <MiniBtn
          text={tCommon('cancel')}
          textColor="text-sv"
          hoverColor="hover:bg-bg"
          onClick={onClose}
        />
        <MiniBtn
          text={t('button')}
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          onClick={onMoveToStorage}
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default MoveToStorageModal;
