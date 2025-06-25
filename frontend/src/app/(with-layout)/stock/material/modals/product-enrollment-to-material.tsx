import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal";

interface ProductEnrollmentToMaterialProps {
  onClose?: () => void;
}

const ProductEnrollmentToMaterial = ({
  onClose,
}: ProductEnrollmentToMaterialProps) => {
  return (
    <Modal
      title="해당 원자재와 연결할 품목을 등록해주세요."
      onClose={onClose}
      width="w-[586px]"
    >
      <div className="flex justify-end h-12 gap-2.5 mt-4 items-center">
        <div className="flex-1">
          <SearchInput placeholder="품목 검색" width="w-full" />
        </div>
        <MiniBtn
          text="직접 추가"
          textColor="text-dg"
          borderColor="border-lg"
          height="h-12"
          hoverColor="hover:bg-bg"
        />
      </div>
      <div className="flex h-10 gap-2.5 justify-end mt-4">
        <MiniBtn
          text="취소하기"
          textColor="text-sv"
          onClick={onClose}
          hoverColor=""
        />
        <MiniBtn
          text="등록하기"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          disabled={true}
        />
      </div>
    </Modal>
  );
};

export default ProductEnrollmentToMaterial;
