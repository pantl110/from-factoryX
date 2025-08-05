import { ArrowsOutIcon, PencilSimple } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';
import EnlargeImageOverlay from './modals/enlarge-image-overlay';
import Image from 'next/image';
import ExcelUploadModal from '../project/process/modals/excel-upload-modal';

interface ImagePreviewProps {
  className?: string;
  isOrderStatus: boolean;
}

const ImagePreview = ({ className = '', isOrderStatus }: ImagePreviewProps) => {
  const [isEnlargeOpen, setIsEnlargeOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const imageUrl = '/36097517.jpg';

  return (
    <div
      className={`bg-sv rounded-lg h-full relative ${className} flex items-center justify-center`}
    >
      <Image
        src={imageUrl}
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
          imageUrl={imageUrl}
          onClose={() => setIsEnlargeOpen(false)}
        />
      )}
      {isUploadModalOpen && (
        <ExcelUploadModal
          documentTitle={isOrderStatus ? '주문서' : '견적 요청서'}
          onClose={() => setIsUploadModalOpen(false)}
          onComplete={() => {}}
        />
      )}
    </div>
  );
};

export default ImagePreview;
