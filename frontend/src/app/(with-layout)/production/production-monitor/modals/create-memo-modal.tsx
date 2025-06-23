import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal";

interface CreateMemoModalProps {
  onClose: () => void;
}

const CreateMemoModal = ({ onClose }: CreateMemoModalProps) => {
  return (
    <Modal
      title="메모 작성"
      subtitle="입력된 메모는 생산 현황에서 확인할 수 있어요."
      width="w-[586px]"
      height="h-[691px]"
      sm={true}
      onClose={onClose}
    >
      <div className="flex flex-col min-h-0 h-full">
        <input
          className="w-full mt-4 Re_Body-1 text-sv px-3 h-12 border border-[#E4E4E7] rounded"
          placeholder="제목을 입력하세요."
        />
        <textarea
          className="h-[448px] mt-4 Re_Body-1 text-gr px-3 py-5 border border-[#E4E4E7] rounded overflow-y-auto"
          placeholder="메모를 입력하세요."
        />
        <div className="flex gap-2.5 justify-end mt-4">
          <MiniBtn text="취소하기" textColor="text-sv" onClick={onClose} />
          <MiniBtn
            text="메모 생성하기"
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="hover:bg-primary-hover"
            onClick={onClose}
          />
        </div>
      </div>
    </Modal>
  );
};

export default CreateMemoModal;
