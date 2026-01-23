import { useTranslations } from 'next-intl';
import Modal from '@/ui/modal/modal';
import { OcrDataModel } from '@/types/data-model';
import DropzoneArea from '@/ui/dropzone-area';
import { useState } from 'react';
import { useOcrUpload } from '@/hooks';
import Spinner from '@/ui/spinner';

interface UploadModalProps {
  onClose: () => void;
  onComplete: (ocrData?: OcrDataModel, imageUrl?: string) => void;
  documentTitle: string;
}

const ExcelUploadModal = ({
  onClose,
  onComplete,
  documentTitle,
}: UploadModalProps) => {
  const t = useTranslations('document.excelUpload');
  const [hasFiles, setHasFiles] = useState(false);
  const { uploadOcr, isLoading } = useOcrUpload();

  const handleComplete = async (file?: File) => {
    if (file) {
      try {
        const result = await uploadOcr(file);
        if (result.status === 'success') {
          // OCR 성공 시 데이터 반환
          onComplete(result.data, result.imageUrl);
          onClose(); // 모달 닫기 추가
        } else {
          // OCR 실패 시 에러 처리
          alert(
            t('errors.ocrFailed') + (result.message ? ' ' + result.message : '')
          );
          onComplete(undefined, result.imageUrl); // OCR 실패 시에도 업로드된 이미지 URL 전달
          onClose(); // 모달 닫기 추가
        }
      } catch (err) {
        alert(t('errors.uploadError') + (err ? ' ' + String(err) : ''));
        onComplete();
        onClose(); // 모달 닫기 추가
      }
    } else {
      // 파일이 없는 경우 빈 데이터 반환
      onComplete();
      onClose(); // 모달 닫기 추가
    }
  };

  const onFileUpload = (hasFiles: boolean) => {
    setHasFiles(hasFiles);
  };

  const title = hasFiles
    ? t('title.hasFiles')
    : t('title.noFiles', { documentTitle });

  const subtitle = hasFiles ? t('subtitle.hasFiles') : t('subtitle.noFiles');

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      width="w-[600px]"
    >
      <div className="mt-3">
        {isLoading ? (
          <div className="flex justify-center items-center h-50">
            <Spinner />
          </div>
        ) : (
          <DropzoneArea
            onClose={onClose}
            fileCount={1}
            onComplete={(files) => {
              if (files && files.length > 0) {
                handleComplete(files[0]);
              } else {
                handleComplete();
              }
            }}
            onFileUpload={onFileUpload}
            accept={{
              'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
              'application/pdf': ['.pdf'],
            }}
          />
        )}
      </div>
    </Modal>
  );
};

export default ExcelUploadModal;
