import { ArrowsOutIcon, PencilSimple } from '@phosphor-icons/react/dist/ssr';
import { useState, useEffect } from 'react';
import EnlargeImageOverlay from './modals/enlarge-image-overlay';
import Image from 'next/image';
import ExcelUploadModal from '../project/process/modals/excel-upload-modal';
import { OcrDataModel } from '@/types/data-model';
import useOcrStore from '@/store/ocr-store';

interface ImagePreviewProps {
  className?: string;
  isOrderStatus: boolean;
  imageUrl?: string | null;
  onOcrDataChange?: (ocrData: OcrDataModel) => void;
}

const ImagePreview = ({
  className = '',
  isOrderStatus,
  imageUrl: propImageUrl,
  onOcrDataChange,
}: ImagePreviewProps) => {
  const [isEnlargeOpen, setIsEnlargeOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { imageUrl: storeImageUrl, setOcrData, ocrData } = useOcrStore();

  // prop으로 전달된 imageUrl이 있으면 사용, 없으면 store에서 가져온 것 사용
  const displayImageUrl = propImageUrl || storeImageUrl || '';

  // OCR 데이터가 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    if (ocrData && onOcrDataChange) {
      onOcrDataChange(ocrData);
    }
  }, [ocrData, onOcrDataChange]);

  const handleOcrComplete = (ocrData?: OcrDataModel, imageUrl?: string) => {
    if (ocrData) {
      // OCR 데이터가 있으면 견적서 생성 페이지로 이동

      // Zustand store에 OCR 데이터 저장
      setOcrData(ocrData, imageUrl || '');

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
        alt={isOrderStatus ? '주문서' : '견적서'}
        width={500}
        height={300}
        className="w-[95%] max-h-[95%] object-contain rounded-lg"
        quality={100}
        unoptimized={true}
      />
      <div className="flex absolute top-0 right-0 ">
        <button
          className="w-10 h-10 flex items-center justify-center bg-[#cfcfcf] rounded-bl-lg hover:bg-gr transition-colors duration-200 z-1"
          onClick={() => setIsUploadModalOpen(true)}
        >
          <PencilSimple size={20} className="text-sv" />
        </button>
        <button
          className="w-10 h-10 flex items-center justify-center bg-[#cfcfcf] rounded-tr-lg  hover:bg-gr transition-colors duration-200 z-1"
          onClick={() => setIsEnlargeOpen(true)}
        >
          <ArrowsOutIcon size={20} className="text-sv" />
        </button>
      </div>
      {isEnlargeOpen && (
        <EnlargeImageOverlay
          imageUrl={displayImageUrl}
          onClose={() => setIsEnlargeOpen(false)}
        />
      )}
      {isUploadModalOpen && (
        <ExcelUploadModal
          documentTitle={isOrderStatus ? '주문서' : '견적 요청서'}
          onClose={() => setIsUploadModalOpen(false)}
          onComplete={handleOcrComplete}
        />
      )}
    </div>
  );
};

export default ImagePreview;
