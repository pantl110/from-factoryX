import { ArrowsOutIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import EnlargeImageOverlay from "./modals/enlarge-image-overlay";

interface ImagePreviewProps {
  className?: string;
}

const ImagePreview = ({ className = "" }: ImagePreviewProps) => {
  const [isEnlargeOpen, setIsEnlargeOpen] = useState(false);
  const imageUrl =
    "https://yimgf-thinkzon.yesform.com/docimgs/public/1/37/36098/36097517.jpg";
  return (
    <div
      className={`bg-sv rounded-lg h-full relative ${className} flex items-center justify-center`}
    >
      <img
        src={imageUrl}
        alt="견적서"
        className="w-[95%] max-h-[95%] object-contain rounded-lg"
      />
      <button
        className="absolute top-0 right-0 w-10 h-10 flex items-center justify-center bg-[#cfcfcf] rounded-bl-lg rounded-tr-lg hover:bg-gr transition-colors duration-200 z-1"
        onClick={() => setIsEnlargeOpen(true)}
      >
        <ArrowsOutIcon size={20} className="text-sv" />
      </button>
      {isEnlargeOpen && (
        <EnlargeImageOverlay
          imageUrl={imageUrl}
          setIsEnlargeOpen={setIsEnlargeOpen}
          onClose={() => setIsEnlargeOpen(false)}
        />
      )}
    </div>
  );
};

export default ImagePreview;
