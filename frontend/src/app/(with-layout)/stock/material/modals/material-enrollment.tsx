import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";

interface MaterialEnrollmentProps {
  onClose?: () => void;
}

const MaterialEnrollment = ({ onClose }: MaterialEnrollmentProps) => {
  return (
    <Modal
      title="이 거래처에서 구매한 원자재를 등록해주세요."
      subtitle="입력한 거래처로부터 실제로 구매한 원자재 정보를 입력해 주세요."
      onClose={onClose}
      width="w-[586px]"
    >
      <div className="flex justify-end h-12 gap-2.5 mt-4 items-center">
        <div className="flex-1">
          <SearchInput placeholder="원자재 검색" width="w-full" />
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

export default MaterialEnrollment;
