import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal";
import SearchInput from "@/ui/search-input";

interface AddReturnModalProps {
  onClose: () => void;
}

const AddReturnModal = ({ onClose }: AddReturnModalProps) => {
  return (
    <Modal
      title="반품할 상품을 등록해 주세요."
      subtitle="반품할 품목명과 수량, 일자를 입력해 주세요."
      onClose={onClose}
      width="w-[586px]"
    >
      <div className="w-full mt-4">
        <SearchInput placeholder="품목명 검색" width="w-full" />
      </div>
      <div className="w-full mt-4">
        <Input
          label="반품 수량"
          placeholder="반품할 수량을 입력해 주세요."
          required
        />
      </div>
      <div className="w-full mt-4">
        <Input
          label="반품 일자"
          placeholder="반품할 일자를 입력해 주세요."
          required
        />
      </div>
      <div className="flex gap-2.5 mt-4 justify-end">
        <MiniBtn text="취소하기" onClick={onClose} textColor="text-sv" />
        <MiniBtn
          text="등록하기"
          onClick={onClose}
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
        />
      </div>
    </Modal>
  );
};

export default AddReturnModal;
