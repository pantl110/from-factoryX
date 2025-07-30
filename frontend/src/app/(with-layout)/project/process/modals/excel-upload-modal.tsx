import Modal from '@/ui/modal/modal';
import { OcrDataModel } from '@/types/data-model';
import DropzoneArea from '@/ui/dropzone-area';
import { useState } from 'react';
import { useOcrUpload } from '@/hooks';
import Spinner from '@/ui/spinner';

interface UploadModalProps {
  onClose: () => void;
  onComplete: (ocrData?: OcrDataModel) => void;
  documentTitle: string;
}

const ExcelUploadModal = ({
  onClose,
  onComplete,
  documentTitle,
}: UploadModalProps) => {
  const [hasFiles, setHasFiles] = useState(false);
  const { uploadOcr, isLoading } = useOcrUpload();

  const handleComplete = async (file?: File) => {
    if (file) {
      try {
        const result = await uploadOcr(file);
        if (result.status === 'success') {
          // OCR 성공 시 데이터 반환 ‼️‼️‼️‼️‼️‼️‼️ 수정 필요
          // TODO: OCR 결과 데이터를 파싱
          alert('OCR 처리 성공');
          onComplete();
        } else {
          // OCR 실패 시 에러 처리
          alert('OCR 처리에 실패했습니다.' + result.message);
          onComplete();
        }
      } catch (err) {
        alert('OCR 업로드 중 오류가 발생했습니다.' + err);
        onComplete();
      }
    } else {
      // 파일이 없는 경우 빈 데이터 반환
      onComplete();
    }
  };

  const onFileUpload = (hasFiles: boolean) => {
    setHasFiles(hasFiles);
  };

  const title = hasFiles
    ? '업로드된 파일을 확인해 주세요.'
    : `${documentTitle} 파일을 업로드해 주세요.`;

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
        {isLoading ? (
          <div className="flex justify-center items-center h-50">
            <Spinner />
          </div>
        ) : (
          <DropzoneArea
            onClose={onClose}
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
