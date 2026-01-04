import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { CaretDown, WarningCircle, X } from '@phosphor-icons/react/dist/ssr';
import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import AuthDropdown from './auth-dropdown';
import { MemberFromDataModel } from '../../general/types';
import ProfileImage from '@/ui/profile-image';
import Chip from '@/ui/chip';
import { PermissionRoleInfo, PermissionRoleType } from '../types';
import { createPortal } from 'react-dom';
import { usePortalDropdown } from '@/hooks/use-portal-dropdown';
import useInviteMember from '@/hooks/factory/factory-member/use-invite-member';
import useMemberStore from '@/store/member-store';
import Toast from '@/ui/toast';
import useToast from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

interface InviteModalProps {
  onClose: () => void;
}

interface EmailFormDataModel {
  email: string;
  auth: string;
}

const InviteModal = ({ onClose }: InviteModalProps) => {
  const tCommon = useTranslations('common');
  const tInviteModal = useTranslations(
    'setting.systemSetting.permission.inviteModal'
  );
  const tPermission = useTranslations('setting.systemSetting.permission');

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [changeAuthEmail, setChangeAuthEmail] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberFromDataModel[]>([]);

  const { inviteMember, isLoading: isInviteLoading } = useInviteMember();
  const factoryId = useMemberStore((state) => state.factoryId);

  // 토스트 훅 사용
  const { isToastOpen, isVisible, showToast } = useToast();
  const [toastText, setToastText] = useState('');
  const [toastSubtext, setToastSubtext] = useState('');

  const {
    control,
    watch,
    reset,
    formState: { errors, isValid },
    getValues,
  } = useForm<EmailFormDataModel>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      auth: '',
    },
  });

  const emailValue = watch('email');
  const isEmailValid = isValid && !errors.email && emailValue.trim() !== '';

  // 중복 이메일 체크
  const isDuplicateEmail =
    emailValue.trim() !== '' &&
    members.some((member) => member.email === emailValue.trim());
  const shouldSelectAuth = isEmailValid && !isDuplicateEmail;

  const authBtnDivRef = useRef<HTMLDivElement>(null);
  const {
    isOpen: isAuthBtnDropdownOpen,
    anchorRect: authBtnAnchorRect,
    openDropdown: openAuthBtnDropdown,
    closeDropdown: closeAuthBtnDropdown,
  } = usePortalDropdown();

  const handleRemoveMember = (email: string) => {
    setMembers((prev) => prev.filter((member) => member.email !== email));
  };

  // 역할 키 매핑 (한국어 -> 번역 키)
  const roleKeyMap: Record<string, string> = {
    '시스템 관리자': 'admin',
    운영자: 'manager',
    생산관리자: 'prod_manager',
    조회자: 'viewer',
  };

  const getRoleText = (role: string) => {
    const key = roleKeyMap[role];
    return key ? tPermission(`roles.${key}`) : role;
  };

  const handleAuthSelect = (auth: string, memberEmail?: string) => {
    if (memberEmail) {
      // 멤버 리스트에서 권한 변경 시
      setMembers((prev) => {
        const updatedMembers = prev.map((member) =>
          member.email === memberEmail ? { ...member, auth } : member
        );
        return updatedMembers;
      });

      setChangeAuthEmail(null);
    } else if (isEmailValid) {
      // 이메일이 유효한 상태에서 권한 선택 시 멤버 리스트에 추가
      const formData = getValues();

      const newMember: MemberFromDataModel = {
        email: formData.email,
        auth,
      };

      setMembers((prev) => {
        const updatedMembers = [...prev, newMember];
        return updatedMembers;
      });

      reset({ email: '', auth: '' }); // 폼 리셋
      closeAuthBtnDropdown();
    }
  };

  const handleInviteMembers = async () => {
    if (!factoryId || members.length === 0) return;

    try {
      // 모든 멤버들을 순차적으로 초대
      const invitePromises = members.map((member) => {
        const apiRole =
          member.auth === '시스템 관리자'
            ? 'admin'
            : member.auth === '운영자'
              ? 'manager'
              : member.auth === '생산관리자'
                ? 'prod_manager'
                : 'viewer';
        return inviteMember({
          factory_id: factoryId,
          email: member.email,
          role: apiRole,
        });
      });

      const results = await Promise.all(invitePromises);

      // 모든 초대가 성공했는지 확인
      const isAllSuccessful = results.every((result) => result.success);

      if (isAllSuccessful) {
        setIsSuccessOpen(true);
      } else {
        // 일부 실패한 경우 에러 처리
        const failedDetails = results
          .map((result, index) => ({
            email: members[index].email,
            error: result.error,
            success: result.success,
          }))
          .filter((item) => !item.success);

        // "이미 팩토리 멤버입니다" 오류가 있는지 확인
        const hasAlreadyMemberError = failedDetails.some((detail) =>
          detail.error.includes('이미 팩토리 멤버입니다')
        );

        if (hasAlreadyMemberError) {
          setToastText(tInviteModal('errors.cannotInvite'));
          setToastSubtext(tInviteModal('errors.cannotInviteSubtext'));
          showToast();
        } else {
          // 구체적인 에러 메시지 생성
          const errorDetails = failedDetails
            .map((detail) => `${detail.email}: ${detail.error}`)
            .join('\n');

          setToastText(tInviteModal('errors.inviteFailed'));
          setToastSubtext(errorDetails);
          showToast();
        }
      }
    } catch {
      setToastText(tInviteModal('errors.inviteError'));
      setToastSubtext(tInviteModal('errors.tryAgain'));
      showToast();
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
          title={tInviteModal('title')}
          subtitle={tInviteModal('subtitle')}
          onClose={onClose}
          width="w-[600px]"
          scroll={true}
        >
          <div className="flex gap-2.5 w-full mt-4 mb-5 px-6">
            <div className="flex-1">
              <Controller
                name="email"
                control={control}
                rules={{
                  required: tInviteModal('errors.emailRequired'),
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: tInviteModal('errors.emailInvalid'),
                  },
                }}
                render={({ field }) => (
                  <div>
                    <Input
                      placeholder={tCommon('placeholders.email')}
                      value={field.value}
                      onChange={(e) => field.onChange(e)}
                      onBlur={() => field.onBlur()}
                    />
                  </div>
                )}
              />
            </div>

            <div onClick={(e) => openAuthBtnDropdown(e)} ref={authBtnDivRef}>
              <MiniBtn
                text={tInviteModal('authButton')}
                textColor="text-dg"
                borderColor="border-lg"
                icon={CaretDown}
                iconPosition="right"
                height="h-12"
                hoverColor="hover:bg-bg"
                disabled={!shouldSelectAuth}
              />
            </div>
          </div>

          {isAuthBtnDropdownOpen &&
            shouldSelectAuth &&
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
          <div className="flex-1 max-h-[calc(85vh-181px)] overflow-y-auto px-6 scrollbar-hide">
            {/* 멤버 리스트 */}
            {members.length > 0 && (
              <div className="pt-4 pb-5">
                <h4 className="Heading-5 text-dg mb-2">
                  {tInviteModal('memberTitle')}
                </h4>
                <div className="flex flex-col gap-2">
                  {members.map((member) => (
                    <div
                      key={member.email}
                      className="flex items-center justify-between p-3 border border-lg rounded-[4px]"
                    >
                      <div className="flex gap-3">
                        <ProfileImage text={member.email} size="small" />
                        <p className="Me_Body-2">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-1 relative">
                        <Chip
                          text={getRoleText(member.auth)}
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
                          onClick={() => setChangeAuthEmail(member.email)}
                        />
                        {changeAuthEmail === member.email && (
                          <div className="absolute top-12 right-11 z-10">
                            <AuthDropdown
                              onClose={() => setChangeAuthEmail(null)}
                              onSelect={(auth) =>
                                handleAuthSelect(auth, member.email)
                              }
                            />
                          </div>
                        )}
                        <button
                          onClick={() => handleRemoveMember(member.email)}
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
                text={tCommon('cancel')}
                textColor="text-sv"
                onClick={onClose}
                hoverColor="hover:bg-bg"
              />
              <MiniBtn
                text={tInviteModal('inviteButton')}
                textColor="text-wh"
                bgColor="bg-primary"
                onClick={handleInviteMembers}
                hoverColor="hover:bg-primary-hover"
                disabled={members.length === 0 || isInviteLoading}
              />
            </div>
          </div>
        </Modal>
      ) : (
        <Modal
          title={tInviteModal('successTitle')}
          subtitle={tInviteModal('successSubtitle')}
          onClose={handleSuccessClose}
        >
          <div className="flex justify-end mt-4 gap-[5px]">
            <MiniBtn
              text={tCommon('close')}
              textColor="text-sv"
              onClick={handleSuccessClose}
              hoverColor="hover:bg-bg"
            />
            <MiniBtn
              text={tCommon('confirm')}
              textColor="text-wh"
              bgColor="bg-primary"
              onClick={handleSuccessClose}
              hoverColor="hover:bg-primary-hover"
            />
          </div>
        </Modal>
      )}

      {/* 초대 실패 토스트 */}
      {isToastOpen && (
        <Toast
          text={toastText}
          subtext={toastSubtext}
          type="red"
          icon={<WarningCircle size={20} className="text-red" />}
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default InviteModal;
