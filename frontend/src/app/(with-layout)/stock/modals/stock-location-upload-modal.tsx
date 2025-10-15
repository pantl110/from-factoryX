import Modal from '@/ui/modal/modal';
import DropzoneArea from '@/ui/dropzone-area';
import { useState } from 'react';

interface StockLocationUploadModalProps {
  onClose: () => void;
  fileCount: number;
  onComplete: (uploadedFiles: File[]) => void;
}

const StockLocationUploadModal = ({
  onClose,
  fileCount,
  onComplete,
}: StockLocationUploadModalProps) => {
  const [hasFiles, setHasFiles] = useState(false);

  const handleComplete = (uploadedFiles: File[]) => {
    onComplete(uploadedFiles);
    onClose();
  };

  const onFileUpload = (hasFiles: boolean) => {
    setHasFiles(hasFiles);
  };

  const title = hasFiles
    ? '업로드된 파일을 확인해 주세요.'
    : '제품 창고 사진을 업로드해 주세요.';

  const subtitle = hasFiles
    ? '파일이 맞는지 확인 후, 업로드를 눌러주세요.'
    : 'JPG, PNG 등 이미지 파일만 업로드할 수 있어요.';

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      width="w-[600px]"
      scroll={true}
    >
      <div className="mt-4 px-6 pb-6 max-h-[calc(85vh-133px)] overflow-y-auto scrollbar-hide">
        <DropzoneArea
          onClose={onClose}
          onComplete={handleComplete}
          onFileUpload={onFileUpload}
          accept={{
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'image/webp': ['.webp'],
          }}
          fileCount={fileCount}
        />
      </div>
    </Modal>
  );
};

export default StockLocationUploadModal;
