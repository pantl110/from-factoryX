import { ArrowsOutIcon, PencilSimple } from '@phosphor-icons/react/dist/ssr';
import { useState, useEffect, useMemo } from 'react';
import EnlargeImageOverlay from './modals/enlarge-image-overlay';
import Image from 'next/image';
import ExcelUploadModal from '../project/process/modals/excel-upload-modal';
import { OcrDataModel, ProjectStatusType } from '@/types/data-model';
import useOcrStore from '@/store/ocr-store';
import useMemberStore from '@/store/member-store';
import { useTranslations } from 'next-intl';

interface ImagePreviewProps {
  className?: string;
  projectStatus: ProjectStatusType;
  imageUrl?: string | null;
  onOcrDataChange?: (ocrData: OcrDataModel) => void;
}

const isPdfUrl = (url: string) => {
  if (!url) return false;
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith('.pdf');
  } catch {
    return url.toLowerCase().includes('.pdf');
  }
};

const getPreviewImageUrl = ({
  fileUrl,
  isPdf,
  thumbnailUrl,
  thumbnailBase64,
}: {
  fileUrl: string;
  isPdf: boolean;
  thumbnailUrl: string | null;
  thumbnailBase64?: string | null;
}) => {
  if (isPdf) {
    if (thumbnailUrl) return thumbnailUrl;
    if (thumbnailBase64) {
      return `data:image/png;base64,${thumbnailBase64}`;
    }
  }
  return fileUrl;
};

const ImagePreview = ({
  className = '',
  projectStatus,
  imageUrl: propImageUrl,
  onOcrDataChange,
}: ImagePreviewProps) => {
  const tDocumentType = useTranslations('document.type');
  const [isEnlargeOpen, setIsEnlargeOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const {
    imageUrl: storeImageUrl,
    thumbnailUrl,
    setOcrData,
    ocrData,
  } = useOcrStore();
  const role = useMemberStore((state) => state.role);
  // 원본 파일 URL: prop으로 전달된 imageUrl이 있으면 사용, 없으면 store에서 가져온 것 사용
  const displayFileUrl = propImageUrl || storeImageUrl || '';

  const isPdf = useMemo(() => isPdfUrl(displayFileUrl), [displayFileUrl]);

  // 미리보기용 URL
  const displayImageUrl = useMemo(
    () =>
      getPreviewImageUrl({
        fileUrl: displayFileUrl,
        isPdf,
        thumbnailUrl,
        thumbnailBase64: ocrData?.thumbnail_image ?? null,
      }),
    [displayFileUrl, isPdf, thumbnailUrl, ocrData?.thumbnail_image]
  );

  // OCR 데이터가 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    if (ocrData && onOcrDataChange) {
      onOcrDataChange(ocrData);
    }
  }, [ocrData, onOcrDataChange]);

  const handleOcrComplete = (
    ocrData?: OcrDataModel,
    imageUrl?: string,
    thumbnailUrl?: string
  ) => {
    if (ocrData) {
      // OCR 데이터가 있으면 견적서 생성 페이지로 이동

      // Zustand store에 OCR 데이터 + 원본 URL + 썸네일 저장
      setOcrData(ocrData, imageUrl || '', thumbnailUrl);

      // 부모 컴포넌트에 OCR 데이터 변경 알림
      if (onOcrDataChange) {
        onOcrDataChange(ocrData);
      }
    }
    setIsUploadModalOpen(false);
  };

  return (
    <div
      className={`bg-sv rounded-lg h-full relative ${className} flex items-center justify-center`}
    >
      <Image
        src={displayImageUrl}
        alt={
          projectStatus === 'confirmed'
            ? tDocumentType('orderDocument')
            : tDocumentType('quotationRequest')
        }
        width={500}
        height={300}
        className="w-[95%] max-h-[95%] object-contain rounded-lg"
        quality={100}
        unoptimized={true}
      />
      <div className="flex absolute top-0 right-0 ">
        {role !== 'viewer' && (
          <button
            className="w-10 h-10 flex items-center justify-center bg-[#cfcfcf] rounded-bl-lg hover:bg-gr transition-colors duration-200 z-1"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <PencilSimple size={20} className="text-sv" />
          </button>
        )}
        <button
          className="w-10 h-10 flex items-center justify-center bg-[#cfcfcf] rounded-tr-lg  hover:bg-gr transition-colors duration-200 z-1"
          onClick={() => setIsEnlargeOpen(true)}
        >
          <ArrowsOutIcon size={20} className="text-sv" />
        </button>
      </div>
      {isEnlargeOpen && (
        <EnlargeImageOverlay
          fileUrl={displayFileUrl}
          previewUrl={displayImageUrl}
          isPdf={isPdf}
          onClose={() => setIsEnlargeOpen(false)}
        />
      )}
      {isUploadModalOpen && (
        <ExcelUploadModal
          documentTitle={
            projectStatus === 'confirmed'
              ? tDocumentType('orderDocument')
              : tDocumentType('quotationRequest')
          }
          onClose={() => setIsUploadModalOpen(false)}
          onComplete={handleOcrComplete}
        />
      )}
    </div>
  );
};

export default ImagePreview;
