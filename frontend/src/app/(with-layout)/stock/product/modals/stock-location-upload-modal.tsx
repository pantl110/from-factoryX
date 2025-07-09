import Modal from "@/ui/modal/modal";
import DropzoneArea from "@/ui/dropzone-area";
import { useState } from "react";

interface StockLocationUploadModalProps {
  onClose: () => void;
}

const StockLocationUploadModal = ({
  onClose,
}: StockLocationUploadModalProps) => {
  const [hasFiles, setHasFiles] = useState(false);

  const handleComplete = () => {
    onClose();
  };

  const onFileUpload = (hasFiles: boolean) => {
    setHasFiles(hasFiles);
  };

  const title = hasFiles
    ? "업로드된 파일을 확인해 주세요."
    : "품목 창고 사진을 업로드해 주세요.";

  const subtitle = hasFiles
    ? "파일이 맞는지 확인 후, 업로드를 눌러주세요."
    : "JPG, PNG 등 이미지 파일만 업로드할 수 있어요.";

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      width="w-[600px]"
    >
      <div className="mt-3">
        <DropzoneArea
          onClose={onClose}
          onComplete={handleComplete}
          onFileUpload={onFileUpload}
          accept={{
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/gif": [".gif"],
            "image/webp": [".webp"],
          }}
        />
      </div>
    </Modal>
  );
};

export default StockLocationUploadModal;
