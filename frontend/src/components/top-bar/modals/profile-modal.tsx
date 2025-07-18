import MiniBtn from '@/ui/mini-btn';
import ProfileImage from '@/ui/profile-image';
import { X } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/auth-store';
import { useLogout } from '@/hooks';

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal = ({ onClose }: ProfileModalProps) => {
  const profileModalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { userInfo } = useAuthStore();
  const { logout, isLoading: isLogoutLoading } = useLogout();

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileModalRef.current &&
        !profileModalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside); // 이벤트 리스너 등록

    return () => {
      document.removeEventListener('mousedown', handleClickOutside); // 언마운트 시 제거
    };
  }, [onClose]);

  // 권한 텍스트 매핑
  const getStatusText = (status: string) => {
    switch (status) {
      case '비활성유저':
        return '조회자';
      case '활성유저':
        return '운영자';
      case '관리자':
        return '시스템 관리자';
      case '탈퇴유저':
        return '탈퇴 사용자';
      default:
        return status;
    }
  };

  return (
    <div
      ref={profileModalRef}
      className="bg-white w-[400px] px-6 py-5 rounded-[12px] border border-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.12)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex gap-6 mb-2">
        {/* 프로필 사진 */}
        <div>
          <ProfileImage />
        </div>

        {/* 개인 정보 */}
        <div className="flex flex-col w-full">
          <div className="flex gap-2.5 items-center justify-between">
            <h4 className="Heading-4">{userInfo?.email || '-'}</h4>
            <button
              className="w-10 h-10 flex justify-center items-center cursor-pointer hover:bg-bg rounded-lg"
              onClick={onClose}
            >
              <X size={16} className="text-sv" />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
              <p className="Me_Body-1 text-sv">
                {getStatusText(userInfo?.status || '-')}
              </p>
              {/* {userInfo?.name && (
                <>
                  <div className="w-[1px] bg-gr h-[56%]"></div>                  
                  <p className="Me_Body-1 text-sv">{userInfo?.name}</p>
                </>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-2.5">
        <div className="flex-1">
          <MiniBtn
            text="프로필 관리"
            borderColor="border-lg"
            textColor="text-dg"
            hoverColor="bg-bg"
            width="w-full"
            onClick={() => {
              router.push('/setting');
              onClose();
            }}
          />
        </div>
        <div className="flex-1">
          <MiniBtn
            text="로그아웃"
            borderColor="border-lg"
            textColor="text-dg"
            hoverColor="bg-bg"
            width="w-full"
            onClick={async () => {
              const result = await logout();
              if (result.success) {
                onClose();
                router.push('/login');
              } else {
                // showToast(result.error || '로그아웃에 실패했습니다.')
              }
            }}
            disabled={isLogoutLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
