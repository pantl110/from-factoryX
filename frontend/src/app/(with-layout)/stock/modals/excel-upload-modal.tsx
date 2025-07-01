import Modal from "@/ui/modal/modal";
import MiniBtn from "@/ui/mini-btn";

interface ExcelUploadModalProps {
  onClose: () => void;
}

const ExcelUploadModal = ({ onClose }: ExcelUploadModalProps) => {
  return (
    <Modal
      title="엑셀 파일을 업로드하여 재고를 등록해주세요."
      subtitle="예시 파일에 맞춰 작성한 후 업로드하면 품목이 자동 등록돼요."
      onClose={onClose}
      width="w-[600px]"
    >
      <div className="flex justify-end mt-2">
        <MiniBtn
          text="샘플 엑셀 다운로드"
          textColor="text-dg"
          borderColor="border-lg"
          bgColor="bg-white"
          hoverColor="hover:bg-bg"
        />
      </div>
      <div className="flex flex-col gap-4 justify-center items-center mt-2 h-60 border-2 border-dashed border-gr rounded-lg hover:bg-secondary hover:border-primary transition-colors duration-200">
        <p className="Me_Body-2 text-dg">
          파일을 끌어다 놓거나, 아래 버튼으로 업로드할 수 있어요.
        </p>
        <MiniBtn
          text="내 컴퓨터에서 선택"
          textColor="text-dg"
          borderColor="border-lg"
          bgColor="bg-wh"
          hoverColor="hover:bg-bg"
        />
      </div>
    </Modal>
  );
};

export default ExcelUploadModal;
