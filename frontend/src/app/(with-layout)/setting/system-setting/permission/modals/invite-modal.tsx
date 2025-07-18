import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { CaretDown, X } from '@phosphor-icons/react/dist/ssr';
import { useState, useRef } from 'react';
import AuthDropdown from './auth-dropdown';
import { MemberFromDataModel } from '../../general/types';
import ProfileImage from '@/ui/profile-image';
import Chip from '@/ui/chip';
import { PermissionRoleInfo, PermissionRoleType } from '../types';
import { createPortal } from 'react-dom';
import { usePortalDropdown } from '@/hooks/use-portal-dropdown';

interface InviteModalProps {
  onClose: () => void;
}

const InviteModal = ({ onClose }: InviteModalProps) => {
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [changeAuthId, setChangeAuthId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberFromDataModel[]>([]);
  const [memberInput, setMemberInput] = useState({
    email: '',
    auth: '',
  });

  const authBtnDivRef = useRef<HTMLDivElement>(null);
  const {
    isOpen: isAuthBtnDropdownOpen,
    anchorRect: authBtnAnchorRect,
    openDropdown: openAuthBtnDropdown,
    closeDropdown: closeAuthBtnDropdown,
  } = usePortalDropdown();

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  };
  const handleAuthSelect = (auth: string, memberId?: string) => {
    if (memberId) {
      // 멤버 리스트에서 권한 변경 시
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, auth } : member
        )
      );
      setChangeAuthId(null);
    } else if (memberInput.email) {
      // 이메일이 있는 상태에서 권한 선택 시 멤버 리스트에 추가
      const newMember: MemberFromDataModel = {
        email: memberInput.email,
        auth,
        id: crypto.randomUUID(),
      };
      setMembers((prev) => [...prev, newMember]);
      setMemberInput({ email: '', auth: '' });
      closeAuthBtnDropdown();
    }
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
          scroll={true}
          // className="overflow-y-auto"
        >
          <div className="flex gap-2.5 w-full mt-4 mb-5 px-6">
            <div className="flex-1">
              <Input
                placeholder="이메일을 입력하세요."
                value={memberInput.email}
                onChange={(e) =>
                  setMemberInput((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div onClick={(e) => openAuthBtnDropdown(e)} ref={authBtnDivRef}>
              <MiniBtn
                text="권한"
                textColor="text-dg"
                borderColor="border-lg"
                icon={CaretDown}
                iconPosition="right"
                height="h-12"
                hoverColor="hover:bg-bg"
                disabled={!memberInput.email}
              />
            </div>
          </div>

          {isAuthBtnDropdownOpen &&
            memberInput.email &&
            authBtnAnchorRect &&
            createPortal(
              <div
                style={{
                  position: 'fixed',
                  left: authBtnAnchorRect.left + 10,
                  top: authBtnAnchorRect.bottom + 12,
                  zIndex: 50,
                  width: authBtnAnchorRect.width,
                }}
              >
                <AuthDropdown
                  onClose={closeAuthBtnDropdown}
                  onSelect={handleAuthSelect}
                />
              </div>,
              document.body
            )}
          {members.length > 0 && <div className="mx-6 border-t border-lg" />}
          <div className="flex-1 max-h-[calc(85vh-181px)] overflow-y-auto px-6">
            {/* 멤버 리스트 */}
            {members.length > 0 && (
              <div className="pt-4 pb-5">
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
                      <div className="flex items-center gap-1 relative">
                        <Chip
                          text={member.auth}
                          state={true}
                          bgColor={
                            PermissionRoleInfo[
                              member.auth as PermissionRoleType
                            ].chipColor.bg
                          }
                          textColor={
                            PermissionRoleInfo[
                              member.auth as PermissionRoleType
                            ].chipColor.text
                          }
                          hover={
                            PermissionRoleInfo[
                              member.auth as PermissionRoleType
                            ].chipColor.hover
                          }
                          onClick={() => setChangeAuthId(member.id)}
                        />
                        {changeAuthId === member.id && (
                          <div className="absolute top-12 right-11 z-10">
                            <AuthDropdown
                              onClose={() => setChangeAuthId(null)}
                              onSelect={(auth) =>
                                handleAuthSelect(auth, member.id)
                              }
                            />
                          </div>
                        )}
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
            <div className="flex justify-end gap-2.5 mb-6">
              <MiniBtn
                text="취소"
                textColor="text-sv"
                onClick={onClose}
                hoverColor=""
              />
              <MiniBtn
                text="초대"
                textColor="text-wh"
                bgColor="bg-primary"
                onClick={() => setIsSuccessOpen(true)}
                hoverColor="hover:bg-primary-hover"
                disabled={members.length === 0}
              />
            </div>
          </div>
        </Modal>
      ) : (
        <Modal
          title="초대가 완료되었어요."
          subtitle={
            '입력한 이메일로 초대 링크가 전송되었어요.\n팀원이 가입을 완료하면 자동으로 권한이 적용돼요.'
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
