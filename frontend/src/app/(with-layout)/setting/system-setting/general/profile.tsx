import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import { useForm } from "react-hook-form";
import { CameraIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { ProfileFormDataModel } from "./types";
import PhotoUploadModal from "./modals/photo-upload-modal";
import ProfileImage from "@/ui/profile-image";
import { formatPhoneNumber } from "@/hooks/format-number";
import useToast from "@/hooks/use-toast";
import Toast from "@/ui/toast";
import { CheckCircle } from "@phosphor-icons/react";

const Profile = () => {
  const { isToastOpen, isVisible, showToast } = useToast(2000);
  const [isPhotoUploadModalOpen, setIsPhotoUploadModalOpen] = useState(false);

  const { register, handleSubmit } = useForm<ProfileFormDataModel>({
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  const onSubmit = () => {
    showToast();
  };

  return (
    <>
      <form
        className="flex flex-col gap-3.5 border-b pb-8 border-b-[#eeeeee]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h3 className="Heading-3">프로필 정보</h3>
        <div className="flex flex-col gap-8">
          <div className="relative">
            <ProfileImage text="YO" />
            <div
              onClick={() => setIsPhotoUploadModalOpen(true)}
              className="cursor-pointer absolute top-11 left-11 flex items-center justify-center w-[33px] h-[33px] rounded-full border border-lg text-sv bg-white z-20"
            >
              <CameraIcon size={16} weight="fill" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="이름을 입력하세요."
                label="이름"
                {...register("name")}
              />
              <Input
                label="권한"
                value="시스템 관리자" // 사용자에 따라 고정값 변경 필요
                disabledSetting={true}
                required
              />
            </div>
            <div className="flex gap-2">
              <Input
                label="이메일"
                required
                value="yoo@gmail.com" // 사용자에 따라 고정값 변경 필요
                disabledSetting={true}
              />
              <Input
                placeholder="연락처를 입력하세요."
                label="연락처"
                type="tel"
                {...register("phone", {
                  onChange: (e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    e.target.value = formatted;
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
        <PhotoUploadModal onClose={() => setIsPhotoUploadModalOpen(false)} />
      )}
    </>
  );
};

export default Profile;
