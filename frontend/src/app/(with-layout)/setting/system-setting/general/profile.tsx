import Input from '@/ui/input'
import MiniBtn from '@/ui/mini-btn'
import { useForm } from 'react-hook-form'
import { CameraIcon, Pencil } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import PhotoUploadModal from './modals/photo-upload-modal'
import ProfileImage from '@/ui/profile-image'
import { formatPhoneNumber } from '@/hooks/format-number'
import useToast from '@/hooks/use-toast'
import Toast from '@/ui/toast'
import { CheckCircle } from '@phosphor-icons/react'
import { UserInfoModel, UpdateUserInfoModel } from '@/types/data-model'
import { useMe } from '@/hooks/users/use-me'
import EditPhotoDropdown from './modals/edit-photo-dropdown'

interface ProfileProps {
  userInfo: UserInfoModel | null
}

const Profile = ({ userInfo }: ProfileProps) => {
  const { isToastOpen, isVisible, showToast } = useToast(2000)
  const [isPhotoUploadModalOpen, setIsPhotoUploadModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isEditPhotoDropdownOpen, setIsEditPhotoDropdownOpen] = useState(false)
  const { updateMe, isLoading } = useMe()

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<UpdateUserInfoModel>({
    defaultValues: {
      username: '',
      phone_number: '',
      profile_image: '',
    },
    mode: 'onSubmit',
  })

  // Update form when userInfo changes
  useEffect(() => {
    if (userInfo) {
      reset({
        username: userInfo.username || '',
        phone_number: userInfo.phone_number || '',
        profile_image: userInfo.profile_image || '',
      })
      setSelectedImage(null) // 선택된 이미지 초기화
    }
  }, [userInfo, reset])

  const handleImageSelected = (base64Data: string) => {
    setSelectedImage(base64Data)
  }

  const onSubmit = async (data: UpdateUserInfoModel) => {
    try {
      // 선택된 이미지가 있으면 데이터에 추가
      const updateData = {
        ...data,
        ...(selectedImage && { profile_image: selectedImage }),
      }
      const result = await updateMe(updateData)

      if (result.success) {
        showToast()
        setSelectedImage(null) // 성공 후 선택된 이미지 초기화
      } else {
        const errorMessage =
          typeof result.error === 'string' ? result.error : '프로필 정보 수정에 실패했습니다.'
        throw new Error(errorMessage)
      }
    } catch {
      throw new Error('프로필 정보 수정 중 오류가 발생했습니다.')
    }
  }

  // 권한 텍스트 매핑
  const getStatusText = (status: string) => {
    switch (status) {
      case '비활성유저':
        return '조회자'
      case '활성유저':
        return '운영자'
      case '관리자':
        return '시스템 관리자'
      case '탈퇴유저':
        return '탈퇴 사용자'
      default:
        return status
    }
  }

  // 사진이 있는지 확인 (선택된 이미지 또는 기존 프로필 이미지)
  const hasImage = selectedImage || userInfo?.profile_image

  return (
    <>
      <form
        className="flex flex-col gap-3.5 border-b pb-8 border-b-[#eeeeee]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h3 className="Heading-3">프로필 정보</h3>
        <div className="flex flex-col gap-8">
          <div className="relative">
            <ProfileImage selectedImage={selectedImage} />
            <div
              onClick={
                hasImage
                  ? () => setIsEditPhotoDropdownOpen(true)
                  : () => setIsPhotoUploadModalOpen(true)
              }
              className="cursor-pointer absolute top-11 left-11 flex items-center justify-center w-[33px] h-[33px] rounded-full border border-lg text-sv bg-white z-20"
            >
              {hasImage ? (
                <Pencil size={16} weight="fill" />
              ) : (
                <CameraIcon size={16} weight="fill" />
              )}
            </div>
            {isEditPhotoDropdownOpen && (
              <div className="absolute top-11 left-[94px] z-20">
                <EditPhotoDropdown
                  onClose={() => setIsEditPhotoDropdownOpen(false)}
                  onChangePhoto={() => setIsPhotoUploadModalOpen(true)}
                  onDeletePhoto={() => {
                    setSelectedImage(null)
                    setIsEditPhotoDropdownOpen(false)
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input placeholder="이름을 입력하세요." label="이름" {...register('username')} />
              <Input
                label="권한"
                value={userInfo ? getStatusText(userInfo.status) : '-'}
                disabledSetting={true}
                required
              />
            </div>
            <div className="flex gap-2">
              <Input
                label="이메일"
                required
                value={userInfo?.email || '-'}
                disabledSetting={true}
              />
              <Input
                placeholder="연락처를 입력하세요."
                label="연락처"
                type="tel"
                showError={!!errors.phone_number}
                {...register('phone_number', {
                  onChange: (e) => {
                    const formatted = formatPhoneNumber(e.target.value)
                    e.target.value = formatted
                  },
                  pattern: {
                    value: /^(01[016789]-\d{3,4}-\d{4}|0\d{1,2}-\d{3,4}-\d{4})$/,
                    message: '',
                  },
                })}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <MiniBtn
            text="저장"
            textColor="text-primary"
            bgColor="bg-primary-8"
            hoverColor="hover:bg-secondary-hover"
            type="submit"
            disabled={isSubmitting || isLoading}
          />
        </div>
      </form>

      {/* 토스트 */}
      {isToastOpen && (
        <Toast
          icon={<CheckCircle size={24} className="text-primary" />}
          text="저장이 완료되었어요."
          subtext="입력하신 프로필 정보가 업데이트되었어요."
          type="primary"
          isVisible={isVisible}
        />
      )}
      {isPhotoUploadModalOpen && (
        <PhotoUploadModal
          onClose={() => setIsPhotoUploadModalOpen(false)}
          onImageSelected={handleImageSelected}
        />
      )}
    </>
  )
}

export default Profile
