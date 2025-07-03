import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";
import { clientData } from "@/mocks/client-data";
import { ClientDataModel } from "@/types/data-model";
import DropzoneArea from "@/ui/dropzone-area";

interface UploadModalProps {
  onClose: () => void;
  onComplete: (clientData?: ClientDataModel) => void;
}

const ExcelUploadModal = ({ onClose, onComplete }: UploadModalProps) => {
  const handleComplete = () => {
    onComplete(clientData[0]);
  };

  return (
    <Modal
      title="견적 요청서를 파일을 업로드해 주세요."
      subtitle="이미지 파일을 이곳에 끌어다 놓거나 직접 추가할 수 있어요."
      onClose={onClose}
      width="w-[600px]"
    >
      <div className="mt-4 flex justify-end">
        <MiniBtn
          text="샘플 엑셀 다운로드"
          textColor="text-dg"
          bgColor="bg-wh"
          hoverColor="hover:bg-bg"
          borderColor="border-lg"
        />
      </div>

      <div className="mt-3">
        <DropzoneArea onClose={onClose} onComplete={handleComplete} />
      </div>
    </Modal>
  );
};

export default ExcelUploadModal;
