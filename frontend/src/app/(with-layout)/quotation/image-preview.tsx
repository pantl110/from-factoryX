import { ArrowsOutIcon } from "@phosphor-icons/react/dist/ssr";

interface ImagePreviewProps {
  className?: string;
}

const ImagePreview = ({ className = "" }: ImagePreviewProps) => {
  return (
    <div className={`bg-sv rounded-lg h-full relative ${className}`}>
      <div className="absolute top-0 right-0 w-10 h-10 flex items-center justify-center bg-wh/65 rounded-bl-lg">
        <ArrowsOutIcon size={20} className="text-dg" />
      </div>
    </div>
  );
};

export default ImagePreview;
