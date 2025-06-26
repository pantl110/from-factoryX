import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";
import SearchInput from "@/ui/search-input";

interface ConnectMaterialModalProps {
  onClose: () => void;
}

const ConnectMaterialModal = ({ onClose }: ConnectMaterialModalProps) => {
  return (
    <Modal
      title="품목과 연결할 원자재를 선택하거나 새로 추가해 주세요."
      width="w-[586px]"
      onClose={onClose}
    >
      <div className="mt-4 flex gap-2.5">
        <SearchInput placeholder="원자재 검색" width="flex-1" />
        <MiniBtn
          text="직접 추가"
          textColor="text-dg"
          borderColor="border-lg"
          hoverColor="bg-bg"
        />
      </div>
      <div className="mt-4 flex gap-2.5 justify-end">
        <MiniBtn
          text="취소하기"
          textColor="text-sv"
          hoverColor="bg-bg"
          onClick={onClose}
        />
        <MiniBtn
          text="추가하기"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
        />
      </div>
    </Modal>
  );
};

export default ConnectMaterialModal;
