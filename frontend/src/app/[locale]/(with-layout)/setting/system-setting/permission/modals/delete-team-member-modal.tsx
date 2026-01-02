import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface DeleteTeamMemberModalProps {
  onClose: () => void;
  onDelete: () => void;
}

const DeleteTeamMemberModal = ({
  onClose,
  onDelete,
}: DeleteTeamMemberModalProps) => {
  const t = useTranslations(
    'setting.systemSetting.permission.deleteTeamMemberModal'
  );
  const tCommon = useTranslations('common');

  return (
    <Modal title={t('title')} subtitle={t('subtitle')} onClose={onClose}>
      <div className="flex justify-end mt-4 gap-[5px]">
        <MiniBtn
          text={tCommon('cancel')}
          textColor="text-sv"
          onClick={onClose}
          hoverColor="hover:bg-bg"
        />
        <MiniBtn
          text={tCommon('delete')}
          textColor="text-red"
          bgColor="bg-red-8"
          onClick={onDelete}
          hoverColor="hover:bg-red-hover "
        />
      </div>
    </Modal>
  );
};

export default DeleteTeamMemberModal;
