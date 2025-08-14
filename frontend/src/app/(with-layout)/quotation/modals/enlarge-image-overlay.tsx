import { useEffect } from 'react';
import { ArrowsInSimple } from '@phosphor-icons/react';
import Image from 'next/image';

interface EnlargeImageOverlayProps {
  imageUrl: string;
  onClose: () => void;
}

const EnlargeImageOverlay = ({
  imageUrl,
  onClose,
}: EnlargeImageOverlayProps) => {
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div
      role="presentation"
      className="bg-black/50 w-full min-w-[1000px] h-full fixed top-0 left-0 z-50 flex justify-center items-center"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose?.();
      }}
    >
      <div
        className="relative h-[85%] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={imageUrl}
          alt="확대 이미지"
          width={800}
          height={600}
          className="h-full w-fit object-contain rounded-lg"
          quality={100}
          unoptimized={true}
        />
        <button
          className="absolute top-0 right-0 z-1 w-10 h-10 flex items-center justify-center bg-[#cfcfcf] rounded-bl-lg rounded-tr-lg hover:bg-gr transition-colors duration-200 z-1"
          onClick={onClose}
        >
          <ArrowsInSimple size={20} className="text-sv" />
        </button>
      </div>
    </div>
  );
};

export default EnlargeImageOverlay;
