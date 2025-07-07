import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";
import { CaretDown, X } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import AuthDropdown from "./auth-dropdown";
import { MemberFromDataModel } from "../../general/types";
import ProfileImage from "@/ui/profile-image";
import Chip from "@/ui/chip";
import { PERMISSION_INFO, PermissionRoleType } from "../types";

interface InviteModalProps {
  onClose: () => void;
}

const InviteModal = ({ onClose }: InviteModalProps) => {
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
  const [members, setMembers] = useState<MemberFromDataModel[]>([]);
  const [memberInput, setMemberInput] = useState({
    email: "",
    auth: "",
  });

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  };
  const handleAuthSelect = (auth: string) => {
    if (memberInput.email) {
      // 이메일이 있는 상태에서 권한 선택 시 멤버 리스트에 추가
      const newMember: MemberFromDataModel = {
        email: memberInput.email,
        auth, // 드롭다운에서 선택한 실제 값
        id: crypto.randomUUID(),
      };
      setMembers((prev) => [...prev, newMember]);
      setMemberInput({ email: "", auth: "" }); // 입력 필드 초기화
    }
    setIsAuthDropdownOpen(false);
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
          width="w-[600px]"
        >
          <div className="flex gap-2.5 w-full mt-4 mb-5">
            <div className="flex-1">
              <Input
                placeholder="이메일을 입력하세요."
                value={memberInput.email}
                onChange={(e) =>
                  setMemberInput((prev) => ({ ...prev, email: e.target.value }))
                }
              />
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
                disabled={!memberInput.email}
              />
              {isAuthDropdownOpen && memberInput.email && (
                <div className="absolute top-14 right-0">
                  <AuthDropdown
                    onClose={() => setIsAuthDropdownOpen(false)}
                    onSelect={handleAuthSelect}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 멤버 리스트 */}
          {members.length > 0 && (
            <div className="pt-4 border-t border-lg">
              <h4 className="Heading-5 text-dg mb-2">멤버</h4>
              <div className="flex flex-col gap-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-lg rounded-[4px]"
                  >
                    <div className="flex gap-3">
                      <ProfileImage
                        text={member.email.slice(0, 2).toUpperCase()}
                        size="small"
                      />
                      <p className="Me_Body-2">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Chip
                        text={member.auth}
                        sm={true}
                        bgColor={
                          PERMISSION_INFO[member.auth as PermissionRoleType]
                            .chipColor.bg
                        }
                        textColor={
                          PERMISSION_INFO[member.auth as PermissionRoleType]
                            .chipColor.text
                        }
                        borderColor="border-lg"
                      />
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="w-10 h-10 hover:bg-bg rounded-[8px] flex justify-center items-center"
                      >
                        <X size={16} className="text-sv" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              onClick={() => setIsSuccessOpen(true)}
              hoverColor="hover:bg-primary-hover"
              disabled={members.length === 0}
            />
          </div>
        </Modal>
      ) : (
        <Modal
          title="초대가 완료되었어요."
          subtitle={
            "입력한 이메일로 초대 메일이 전송되었어요.\n팀원이 가입을 완료하면 자동으로 권한이 적용돼요."
          }
          onClose={handleSuccessClose}
          sm={true}
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
