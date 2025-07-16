import useAuthStore from '@/store/auth-store'
import Image from 'next/image'

interface ProfileImageProps {
  size?: 'small' | 'large'
  text?: string
  selectedImage?: string | null
}

const ProfileImage = ({ size = 'large', selectedImage, text }: ProfileImageProps) => {
  const { userInfo } = useAuthStore()

  // 이메일의 앞 2글자 추출
  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U'
    return email.substring(0, 2).toUpperCase()
  }

  // 이메일 기반으로 고정 색상 결정
  const getColorClass = (email: string | null | undefined) => {
    if (!email) return 'primary'

    const colors = ['yellow', 'purple', 'green', 'red', 'primary']

    // 이메일 문자열을 숫자로 변환해서 색상 인덱스 결정
    const hash = email.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0)
    }, 0)

    const colorIndex = hash % colors.length
    return colors[colorIndex]
  }
  const color = getColorClass(userInfo?.email)

  // 선택된 이미지가 있으면 미리보기, 없으면 저장된 이미지 또는 이니셜 표시
  const imageToShow = selectedImage || userInfo?.profile_image
  if (imageToShow) {
    return (
      <Image
        src={`data:image/jpeg;base64,${imageToShow}`}
        alt="Profile"
        width={size === 'small' ? 32 : 72}
        height={size === 'small' ? 32 : 72}
        className={`rounded-full object-cover border border-lg ${
          size === 'small' ? 'w-8 h-8' : 'w-18 h-18'
        }`}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-${color}-8 border border-${color} text-${color} ${
        size === 'small' ? 'w-8 h-8 text-[12px]' : 'w-18 h-18 Me_Body-3'
      }`}
    >
      {text || getInitials(userInfo?.email)}
    </div>
  )
}

export default ProfileImage
