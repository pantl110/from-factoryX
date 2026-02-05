import { useEffect } from 'react';
import { ArrowsInSimple } from '@phosphor-icons/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface EnlargeImageOverlayProps {
  fileUrl: string;
  previewUrl?: string;
  isPdf?: boolean;
  onClose: () => void;
}

const EnlargeImageOverlay = ({
  fileUrl,
  previewUrl,
  isPdf = false,
  onClose,
}: EnlargeImageOverlayProps) => {
  const t = useTranslations('quotation.enlargeImage');

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
        className="relative h-[85%] w-[90%] max-w-[1000px] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isPdf ? (
          <Image
            src={previewUrl || fileUrl}
            alt={t('alt')}
            width={800}
            height={600}
            className="h-full w-fit object-contain rounded-lg"
            quality={100}
            unoptimized={true}
          />
        ) : (
          <Image
            src={fileUrl}
            alt={t('alt')}
            width={800}
            height={600}
            className="h-full w-fit object-contain rounded-lg"
            quality={100}
            unoptimized={true}
          />
        )}
        <button
          className="absolute top-0 right-0 z-10 w-10 h-10 flex items-center justify-center bg-[#cfcfcf] rounded-bl-lg rounded-tr-lg hover:bg-gr transition-colors duration-200"
          onClick={onClose}
        >
          <ArrowsInSimple size={20} className="text-sv" />
        </button>
      </div>
    </div>
  );
};

export default EnlargeImageOverlay;
