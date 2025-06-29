import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import AuthDropdown from "./auth-dropdown";

interface InviteModalProps {
  onClose: () => void;
}

const InviteModal = ({ onClose }: InviteModalProps) => {
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);

  const handleInvite = () => {
    // 실제 초대 로직
    setIsSuccessOpen(true);
  };

  const handleSuccessClose = () => {
    setIsSuccessOpen(false);
    onClose();
  };

  return (
    <>
      {!isSuccessOpen ? (
        <Modal
          title="팩토리엑스에 팀원을 초대하세요."
          subtitle="초대할 분의 이메일과 권한을 설정해주세요."
          onClose={onClose}
          width="w-[586px]"
        >
          <div className="flex gap-2.5 w-full mt-4">
            <div className="flex-1">
              <Input placeholder="이메일을 입력하세요." />
            </div>

            <div className="relative">
              <MiniBtn
                text="권한"
                textColor="text-dg"
                borderColor="border-lg"
                icon={CaretDown}
                iconPosition="right"
                height="h-12"
                hoverColor="hover:bg-bg"
                onClick={() => setIsAuthDropdownOpen(true)}
              />
              {isAuthDropdownOpen && (
                <div className="absolute top-14 right-0">
                  <AuthDropdown onClose={() => setIsAuthDropdownOpen(false)} />
                </div>
              )}
            </div>
          </div>

          <div className="flex mt-5 justify-end gap-2.5">
            <MiniBtn
              text="취소하기"
              textColor="text-sv"
              onClick={onClose}
              hoverColor=""
            />
            <MiniBtn
              text="초대하기"
              textColor="text-wh"
              bgColor="bg-primary"
              onClick={handleInvite}
              hoverColor="hover:bg-primary-hover"
            />
          </div>
        </Modal>
      ) : (
        <Modal
          title="초대가 완료되었어요."
          subtitle={
            "입력한 이메일로 초대 메일이 전송되었어요.\n팀원이 가입을 완료하면 자동으로 권한이 적용돼요."
          }
          width="w-[487px]"
          onClose={handleSuccessClose}
        >
          <div className="flex justify-end mt-4 gap-[5px]">
            <MiniBtn
              text="닫기"
              textColor="text-sv"
              onClick={handleSuccessClose}
              hoverColor=""
            />
            <MiniBtn
              text="확인"
              textColor="text-wh"
              bgColor="bg-primary"
              onClick={handleSuccessClose}
              hoverColor="hover:bg-primary-hover"
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default InviteModal;
