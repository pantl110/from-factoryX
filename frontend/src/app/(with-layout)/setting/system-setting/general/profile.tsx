import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import { useForm } from "react-hook-form";
import { CameraIcon } from "@phosphor-icons/react";
import { useState } from "react";
import SaveModal from "./modals/save-modal";
import { ProfileFormDataModel } from "./types";
import { handleNumberKeyDown, formatPhoneNumber } from "@/hooks/format-number";
import PrifileImage from "@/ui/prifile-image";
import PhotoUploadModal from "./modals/photo-upload-modal";

const Profile = () => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isPhotoUploadModalOpen, setIsPhotoUploadModalOpen] = useState(false);

  const { register, handleSubmit, setValue } = useForm<ProfileFormDataModel>({
    defaultValues: {
      name: "",
      role: "시스템 관리자", // 사용자에 따라 고정값 변경 필요
      email: "yoo@gmail.com", // 사용자에 따라 고정값 변경 필요
      phone: "",
    },
  });

  const onSubmit = () => {
    setIsSaveModalOpen(true);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setValue("phone", formattedValue);
  };

  return (
    <>
      <form
        className="flex flex-col gap-3.5 border-b pb-8 border-b-[#eeeeee]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h3 className="Heading-3">프로필 설정</h3>
        <div className="flex flex-col gap-8">
          <div className="relative">
            <PrifileImage />
            <div
              onClick={() => setIsPhotoUploadModalOpen(true)}
              className="cursor-pointer absolute top-11 left-11 flex items-center justify-center w-[33px] h-[33px] rounded-full border border-lg text-sv bg-white z-20"
            >
              <CameraIcon size={16} weight="fill" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input placeholder="" label="이름" {...register("name")} />
              <Input
                label="권한"
                {...register("role")}
                disabledSetting={true}
              />
            </div>
            <div className="flex gap-2">
              <Input
                label="이메일"
                {...register("email")}
                disabledSetting={true}
              />
              <Input
                placeholder=""
                label="연락처"
                {...register("phone")}
                onChange={handlePhoneChange}
                onKeyDown={handleNumberKeyDown}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <MiniBtn
            text="저장하기"
            textColor="text-primary"
            bgColor="bg-primary-8"
            hoverColor="hover:bg-secondary-hover"
            type="submit"
          />
        </div>
      </form>

      {/* 모달 */}
      {isSaveModalOpen && (
        <SaveModal onClose={() => setIsSaveModalOpen(false)} />
      )}
      {isPhotoUploadModalOpen && (
        <PhotoUploadModal onClose={() => setIsPhotoUploadModalOpen(false)} />
      )}
    </>
  );
};

export default Profile;
