import { Input, MiniBtn, Modal, Toast } from '@/ui';
import { useState } from 'react';
import { formatDate, isValidDateString } from '@/utils';
import { useToast } from '@/hooks';
import { WarningCircle } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

interface CloneProjectModalProps {
  handleCloneProject: (dueDate: string) => void;
  onClose: () => void;
}
const CloneProjectModal = ({
  handleCloneProject,
  onClose,
}: CloneProjectModalProps) => {
  const [dueDate, setDueDate] = useState('');
  const { showToast, isToastOpen, isVisible } = useToast();
  const t = useTranslations('project.process.cloneModal');
  const tCommon = useTranslations('common');

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 날짜 형식 검증
    if (!isValidDateString(dueDate)) {
      showToast();
      return;
    }

    handleCloneProject(dueDate);
  };

  return (
    <>
      <Modal onClose={onClose} title={t('title')} subtitle={t('subtitle')}>
        <div className="flex flex-col mt-4">
          <Input
            label={tCommon('dueDate')}
            placeholder="YYYY-MM-DD"
            value={dueDate}
            onChange={(e) => {
              const formatted = formatDate(e.target.value);
              if (formatted.length <= 10) {
                setDueDate(formatted);
              }
            }}
            required
          />
          <div className="flex justify-end gap-2.5 mt-5">
            <MiniBtn
              text={tCommon('cancel')}
              variant="gray"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            />
            <MiniBtn
              text={t('cloneButton')}
              variant="primary"
              onClick={handleConfirm}
              disabled={!dueDate.trim()}
            />
          </div>
        </div>
      </Modal>

      {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text={t('errors.invalidDate')}
          subtext={t('errors.invalidDateSubtext')}
          type="red"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default CloneProjectModal;
