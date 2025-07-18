import Modal from '@/ui/modal/modal';
import { clientData } from '@/mocks/client-data';
import { ClientDataModel } from '@/types/data-model';
import DropzoneArea from '@/ui/dropzone-area';
import { useState } from 'react';

interface UploadModalProps {
  onClose: () => void;
  onComplete: (clientData?: ClientDataModel) => void;
}

const ExcelUploadModal = ({ onClose, onComplete }: UploadModalProps) => {
  const [hasFiles, setHasFiles] = useState(false);

  const handleComplete = () => {
    onComplete(clientData[0]);
  };

  const onFileUpload = (hasFiles: boolean) => {
    setHasFiles(hasFiles);
  };

  const title = hasFiles
    ? '업로드된 파일을 확인해 주세요.'
    : '견적 요청서 파일을 업로드해 주세요.';

  const subtitle = hasFiles
    ? '파일이 맞는지 확인 후, 업로드를 눌러주세요.'
    : '이미지 또는 PDF 파일을 끌어다 놓거나 업로드할 수 있어요.';

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      width="w-[600px]"
    >
      <div className="mt-3">
        <DropzoneArea
          onClose={onClose}
          onComplete={handleComplete}
          onFileUpload={onFileUpload}
          accept={{
            'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
            'application/pdf': ['.pdf'],
          }}
        />
      </div>
    </Modal>
  );
};

export default ExcelUploadModal;
