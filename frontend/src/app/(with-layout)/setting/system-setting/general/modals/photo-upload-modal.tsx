import DropzoneArea from "@/ui/dropzone-area";
import Modal from "@/ui/modal/modal";
import { useState } from "react";

interface PhotoUploadModalProps {
  onClose: () => void;
}

const PhotoUploadModal = ({ onClose }: PhotoUploadModalProps) => {
  const [hasFiles, setHasFiles] = useState(false);

  const onFileUpload = (hasFiles: boolean) => {
    setHasFiles(hasFiles);
  };

  const title = hasFiles
    ? "업로드된 파일을 확인해 주세요."
    : "새 프로필 사진을 업로드해주세요.";

  const subtitle = hasFiles
    ? "파일이 맞는지 확인 후, 업로드를 눌러주세요."
    : "JPG, PNG 형식의 이미지 파일만 업로드할 수 있어요.";

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      width="w-[600px]"
      gap="mt-0"
    >
      <div className="mt-4">
        <DropzoneArea
          onClose={onClose}
          accept={{
            "image/*": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
          }}
          onFileUpload={onFileUpload}
        />
      </div>
    </Modal>
  );
};

export default PhotoUploadModal;
