import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";

interface PhotoUploadModalProps {
  onClose: () => void;
}

const PhotoUploadModal = ({ onClose }: PhotoUploadModalProps) => {
  const handleComplete = () => {
    onClose();
  };

  return (
    <Modal
      title="새 프로필 사진을 업로드해주세요."
      subtitle="이미지 파일을 이곳에 끌어다 놓거나 직접 추가할 수 있어요."
      onClose={onClose}
      width="w-[600px]"
    >
      <div
        className="mt-4 h-60 rounded-lg border-2 border-dashed border-gr flex flex-col gap-2 justify-center items-center
        hover:bg-secondary transition-colors duration-200 hover:border-primary"
      >
        <p className="Me_Body-2 text-dg">
          파일을 끌어다 놓거나, 아래 버튼으로 업로드 할 수 있어요.
        </p>
        <MiniBtn
          text="내 컴퓨터에서 선택"
          textColor="text-dg"
          bgColor="bg-wh"
          hoverColor="hover:bg-bg"
          borderColor="border-lg"
        />
      </div>
    </Modal>
  );
};

export default PhotoUploadModal;
