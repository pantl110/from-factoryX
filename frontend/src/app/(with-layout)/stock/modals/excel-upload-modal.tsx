import Modal from "@/ui/modal/modal";
import MiniBtn from "@/ui/mini-btn";
import DropzoneArea from "@/ui/dropzone-area";

interface ExcelUploadModalProps {
  onClose: () => void;
}

const ExcelUploadModal = ({ onClose }: ExcelUploadModalProps) => {
  const handleComplete = () => {
    onClose();
  };

  return (
    <Modal
      title="엑셀 파일을 업로드하여 재고를 등록해주세요."
      subtitle="예시 파일에 맞춰 작성한 후 업로드하면 품목이 자동 등록돼요."
      onClose={onClose}
      width="w-[600px]"
    >
      <div className="flex justify-end mt-4">
        <MiniBtn
          text="샘플 엑셀 다운로드"
          textColor="text-dg"
          borderColor="border-lg"
          bgColor="bg-white"
          hoverColor="hover:bg-bg"
        />
      </div>

      <div className="mt-3">
        <DropzoneArea onClose={onClose} onComplete={handleComplete} />
      </div>
    </Modal>
  );
};

export default ExcelUploadModal;
