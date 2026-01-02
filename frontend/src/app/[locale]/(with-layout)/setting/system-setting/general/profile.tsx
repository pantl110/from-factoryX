import { useTranslations } from 'next-intl';
import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { useForm } from 'react-hook-form';
import { CameraIcon, Pencil } from '@phosphor-icons/react';
import { useState, useEffect, useRef } from 'react';
// import PhotoUploadModal from './modals/photo-upload-modal';
import ProfileImage from '@/ui/profile-image';
import { formatPhoneNumber } from '@/utils';
import useToast from '@/hooks/use-toast';
import Toast from '@/ui/toast';
import { CheckCircle } from '@phosphor-icons/react';
import { UserInfoModel, UpdateUserInfoModel } from '@/types/data-model';
import EditPhotoDropdown from './modals/edit-photo-dropdown';
import { useMe, useUploadFile } from '@/hooks';
import useMemberStore from '@/store/member-store';

interface ProfileProps {
  userInfo: UserInfoModel | null;
}

const Profile = ({ userInfo }: ProfileProps) => {
  const t = useTranslations('setting.systemSetting.general.profile');
  const tCommon = useTranslations('common');
  const tPermission = useTranslations('setting.systemSetting.permission');
  const role = useMemberStore((state) => state.role);

  // 번역 키 목록
  const roleKeys = ['admin', 'manager', 'prod_manager', 'viewer'] as const;
  type RoleKeyType = (typeof roleKeys)[number];

  // 한국어 역할명 -> 번역 키 매핑
  const roleKeyMap: Record<string, string> = {
    '시스템 관리자': 'admin',
    운영자: 'manager',
    생산관리자: 'prod_manager',
    조회자: 'viewer',
  };

  // 타입 가드 함수
  const isRoleKey = (role: string): role is RoleKeyType => {
    return (roleKeys as readonly string[]).includes(role);
  };

  const getRoleText = (role: string | null | undefined) => {
    if (!role) return '-';

    // 이미 번역 키인 경우 (admin, manager, prod_manager, viewer)
    if (isRoleKey(role)) {
      return tPermission(`roles.${role}`);
    }

    // 한국어 역할명인 경우 매핑
    const key = roleKeyMap[role];
    return key ? tPermission(`roles.${key}`) : role;
  };

  const { isToastOpen, isVisible, showToast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isEditPhotoDropdownOpen, setIsEditPhotoDropdownOpen] = useState(false);
  const [isImageDeleted, setIsImageDeleted] = useState(false);
  const { updateMe, isLoading } = useMe();
  const { uploadFile } = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    reValidateMode: 'onSubmit', // 모든 필드 유효성 검사를 동시에 실행
  });

  // Update form when userInfo changes
  useEffect(() => {
    if (userInfo) {
      reset({
        username: userInfo.username || '',
        phone_number: userInfo.phone_number || '',
        profile_image: userInfo.profile_image || '',
      });
      setSelectedImage(null); // 선택된 이미지 초기화
      setSelectedImageUrl(null); // 선택된 이미지 URL 초기화
      setIsImageDeleted(false); // 이미지 삭제 상태 초기화
    }
  }, [userInfo, reset]);

  const handleImageSelected = (file: File) => {
    setSelectedImage(file);
    // 파일을 미리보기용 URL로 변환
    const previewUrl = URL.createObjectURL(file);
    setSelectedImageUrl(previewUrl);
    setIsImageDeleted(false); // 새 이미지 선택 시 삭제 상태 해제
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageSelected(file);
    }
  };

  const handlePhotoClick = () => {
    if (hasImage) {
      setIsEditPhotoDropdownOpen(true);
    } else {
      // 파일 선택 다이얼로그 바로 열기
      fileInputRef.current?.click();
    }
  };

  const onSubmit = async (data: UpdateUserInfoModel) => {
    try {
      let profileImageUrl = null;

      // 선택된 이미지 파일이 있으면 S3에 업로드
      if (selectedImage) {
        const uploadResult = await uploadFile(selectedImage);

        if (uploadResult.success) {
          profileImageUrl = uploadResult.object_url;
        } else {
          throw new Error(uploadResult.error || t('errors.imageUploadFailed'));
        }
      }

      // 업로드된 이미지 URL을 데이터에 추가 (삭제된 경우 null로 설정)
      const updateData = {
        ...data,
        profile_image: isImageDeleted
          ? null
          : profileImageUrl || data.profile_image,
      };

      const result = await updateMe(updateData);

      if (result.success) {
        showToast();
        setSelectedImage(null); // 성공 후 선택된 이미지 초기화
        setSelectedImageUrl(null); // 성공 후 선택된 이미지 URL 초기화
        setIsImageDeleted(false); // 성공 후 삭제 상태 초기화
      } else {
        const errorMessage =
          typeof result.error === 'string'
            ? result.error
            : t('errors.updateFailed');
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('errors.updateError');
      throw new Error(errorMessage);
    }
  };

  // 사진이 있는지 확인 (선택된 이미지 또는 기존 프로필 이미지, 삭제되지 않은 경우)
  const hasImage =
    (selectedImageUrl || userInfo?.profile_image) && !isImageDeleted;

  return (
    <>
      <form
        className="flex flex-col gap-3.5 border-b pb-8 border-b-[#eeeeee]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h3 className="Heading-3">{t('title')}</h3>
        <div className="flex flex-col gap-8">
          <div className="relative">
            <ProfileImage
              selectedImage={selectedImageUrl || userInfo?.profile_image}
              isDeleted={isImageDeleted}
            />
            <div
              onClick={handlePhotoClick}
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
                  onChangePhoto={() => {
                    fileInputRef.current?.click();
                    setIsEditPhotoDropdownOpen(false);
                  }}
                  onDeletePhoto={() => {
                    setSelectedImage(null);
                    setSelectedImageUrl(null);
                    setIsImageDeleted(true);
                    setIsEditPhotoDropdownOpen(false);
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder={tCommon('placeholders.name')}
                label={tCommon('name')}
                {...register('username')}
              />
              <Input
                label={tCommon('role')}
                value={getRoleText(role)}
                disabledSetting={true}
                required
              />
            </div>
            <div className="flex gap-2">
              <Input
                label={tCommon('email')}
                required
                value={userInfo?.email || '-'}
                disabledSetting={true}
              />
              <Input
                placeholder={tCommon('placeholders.phone')}
                label={tCommon('phone')}
                type="tel"
                showError={!!errors.phone_number}
                {...register('phone_number', {
                  onChange: (e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    e.target.value = formatted;
                  },
                  pattern: {
                    value:
                      /^(01[016789]-\d{3,4}-\d{4}|0\d{1,2}-\d{3,4}-\d{4})$/,
                    message: '',
                  },
                })}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <MiniBtn
            text={tCommon('save')}
            variant="primary"
            type="submit"
            disabled={isSubmitting || isLoading}
          />
        </div>
      </form>

      {/* 토스트 */}
      {isToastOpen && (
        <Toast
          icon={<CheckCircle size={24} className="text-primary" />}
          text={t('toast.saveSuccess')}
          subtext={t('toast.saveSuccessSubtext')}
          type="primary"
          isVisible={isVisible}
        />
      )}
      {/* 파일 선택 다이얼로그 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
};

export default Profile;
