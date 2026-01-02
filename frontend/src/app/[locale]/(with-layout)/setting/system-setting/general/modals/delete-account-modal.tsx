import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface DeleteAccountModalProps {
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const DeleteAccountModal = ({
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteAccountModalProps) => {
  const t = useTranslations('setting.systemSetting.general.deleteAccountModal');
  const tCommon = useTranslations('common');

  return (
    <Modal title={t('title')} subtitle={t('subtitle')} onClose={onClose}>
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn
          text={tCommon('cancel')}
          textColor="text-sv"
          onClick={onClose}
          hoverColor="hover:bg-bg"
        />
        <MiniBtn
          text={tCommon('delete')}
          bgColor="bg-red-8"
          textColor="text-red"
          onClick={onConfirm}
          hoverColor="hover:bg-red-hover"
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default DeleteAccountModal;
