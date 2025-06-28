import { CameraIcon, X } from "@phosphor-icons/react";

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal = ({ onClose }: ProfileModalProps) => {
  return (
    <div className="bg-white w-[400px] px-6 py-5 rounded-[12px] border border-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.12)]">
      <div className="flex gap-6">
        <div className="relative">
          <div className="flex items-center justify-center rounded-full w-[72px] h-[72px] bg-primary-8 border border-primary Me_Body-3 text-primary">
            JG
          </div>
          <div className="absolute top-11 left-11 flex items-center justify-center w-[33px] h-[33px] rounded-full border border-lg text-sv bg-white z-20">
            <CameraIcon size={16} weight="fill" />
          </div>
        </div>
        <div className="flex flex-col w-full">
          <div className="flex gap-2.5 items-center justify-between">
            <h4 className="Heading-4">yoogj1998@naver.com</h4>
            <button
              className="w-10 h-10 flex justify-center items-center cursor-pointer hover:bg-bg rounded-lg"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
              <p className="Me_Body-1 text-sv">운영자</p>
              <div className="w-[1px] bg-gr h-[56%]"></div>
              <p className="Me_Body-1 text-sv">유길정</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
