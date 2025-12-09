import { Input, MiniBtn, Modal, Toast } from '@/ui';
import { useState } from 'react';
import { formatDate, isValidDateString } from '@/utils';
import { useToast } from '@/hooks';
import { WarningCircle } from '@phosphor-icons/react';

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
      <Modal
        onClose={onClose}
        title="납기일 입력"
        subtitle="해당 프로젝트의 납기일을 입력해 주세요."
      >
        <div className="flex flex-col mt-4">
          <Input
            label="납기일"
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
              text="취소"
              variant="white"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            />
            <MiniBtn
              text="복제"
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
          text="올바른 날짜 형식을 입력해주세요."
          subtext="YYYY-MM-DD 형식으로 입력해주세요."
          type="red"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default CloneProjectModal;
