import { useTranslations } from 'next-intl';
import DropzoneArea from '@/ui/dropzone-area';
import Modal from '@/ui/modal/modal';
import { useState } from 'react';

interface PhotoUploadModalProps {
  onClose: () => void;
  onImageSelected: (file: File) => void;
}

const PhotoUploadModal = ({
  onClose,
  onImageSelected,
}: PhotoUploadModalProps) => {
  const t = useTranslations('setting.systemSetting.general.photoUploadModal');
  const [hasFiles, setHasFiles] = useState(false);

  const onFileUpload = (hasFiles: boolean) => {
    setHasFiles(hasFiles);
  };

  // 업로드 버튼 클릭 시
  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    onImageSelected(file); // 파일 객체를 직접 전달
    onClose(); // 모달 닫기
  };

  const title = hasFiles ? t('title.hasFiles') : t('title.noFiles');

  const subtitle = hasFiles ? t('subtitle.hasFiles') : t('subtitle.noFiles');

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      width="w-[600px]"
      gap="mt-0"
    >
      <div className="mt-4">
        <DropzoneArea
          onClose={onClose}
          fileCount={1}
          accept={{
            'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
          }}
          onFileUpload={onFileUpload}
          onComplete={handleUpload}
        />
      </div>
    </Modal>
  );
};

export default PhotoUploadModal;
