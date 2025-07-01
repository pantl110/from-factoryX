import Dropzone from "@/ui/dropzone";
import Modal from "@/ui/modal/modal";
import { useCallback } from "react";

interface PhotoUploadModalProps {
  onClose: () => void;
}

const PhotoUploadModal = ({ onClose }: PhotoUploadModalProps) => {
  return (
    <Modal
      title="새 프로필 사진을 업로드해주세요."
      subtitle="이미지 파일을 이곳에 끌어다 놓거나 직접 추가할 수 있어요."
      onClose={onClose}
      width="w-[600px]"
    >
      <Dropzone onClose={onClose} />
    </Modal>
  );
};

export default PhotoUploadModal;
