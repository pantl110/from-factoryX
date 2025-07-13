import MiniBtn from '@/ui/mini-btn'
import ProfileImage from '@/ui/profile-image'
import { X } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileModalProps {
  onClose: () => void
}

const ProfileModal = ({ onClose }: ProfileModalProps) => {
  const profileModalRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileModalRef.current && !profileModalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside) // 이벤트 리스너 등록

    return () => {
      document.removeEventListener('mousedown', handleClickOutside) // 언마운트 시 제거
    }
  }, [onClose])

  return (
    <div
      ref={profileModalRef}
      className="bg-white w-[400px] px-6 py-5 rounded-[12px] border border-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.12)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex gap-6 mb-2">
        {/* 프로필 사진 */}
        <div>
          <ProfileImage text="YO" />
        </div>

        {/* 개인 정보 */}
        <div className="flex flex-col w-full">
          <div className="flex gap-2.5 items-center justify-between">
            <h4 className="Heading-4">yoogj1998@naver.com</h4>
            <button
              className="w-10 h-10 flex justify-center items-center cursor-pointer hover:bg-bg rounded-lg"
              onClick={onClose}
            >
              <X size={16} className="text-sv" />
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
              router.push('/setting')
              onClose()
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
          />
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
