import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useTranslations } from 'next-intl';

interface DeleteModalProps {
  onClose: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

const DeleteModal = ({
  onClose,
  onDelete,
  isLoading = false,
}: DeleteModalProps) => {
  const t = useTranslations('common');
  const tDeleteModal = useTranslations('common.deleteModal');

  return (
    <Modal
      title={tDeleteModal('title')}
      subtitle={tDeleteModal('subtitle')}
      onClose={onClose}
    >
      <div className="flex gap-[5px] justify-end mt-4">
        <MiniBtn
          text={t('cancel')}
          textColor="text-sv"
          onClick={onClose}
          hoverColor="hover:bg-bg"
        />
        <MiniBtn
          text={t('delete')}
          textColor="text-red"
          bgColor="bg-red-8"
          onClick={onDelete}
          hoverColor="hover:bg-red-hover"
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default DeleteModal;
