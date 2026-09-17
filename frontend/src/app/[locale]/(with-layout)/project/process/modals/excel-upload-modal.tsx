import { useTranslations } from 'next-intl';
import Modal from '@/ui/modal/modal';
import { OcrDataModel } from '@/types/data-model';
import DropzoneArea from '@/ui/dropzone-area';
import { useState } from 'react';
import { useOcrUpload, useToast } from '@/hooks';
import Spinner from '@/ui/spinner';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';

interface UploadModalProps {
  onClose: () => void;
  onComplete: (
    ocrData?: OcrDataModel,
    imageUrl?: string,
    thumbnailUrl?: string
  ) => void;
  documentTitle: string;
  documentType: 'quotation' | 'order';
}

const ExcelUploadModal = ({
  onClose,
  onComplete,
  documentTitle,
  documentType,
}: UploadModalProps) => {
  const t = useTranslations('document.excelUpload');
  const [hasFiles, setHasFiles] = useState(false);
  const { uploadOcr, isLoading } = useOcrUpload();
  const { isToastOpen, isVisible, showToast } = useToast();

  const handleComplete = async (file?: File) => {
    if (file) {
      try {
        const result = await uploadOcr(file, documentType);
        if (result.status === 'success') {
          // OCR 성공 시 데이터 반환
          onComplete(result.data, result.imageUrl, result.thumbnailUrl);
          onClose(); // 모달 닫기 추가
        } else {
          // OCR 실패 시 토스트로 에러 안내
          showToast();
          onComplete(undefined, result.imageUrl, result.thumbnailUrl); // OCR 실패 시에도 업로드된 파일 URL·썸네일 전달
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
    <>
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

      {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text={t('errors.ocrFailed')}
          subtext=""
          type="red"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default ExcelUploadModal;
