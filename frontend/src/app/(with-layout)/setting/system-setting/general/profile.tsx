import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import { useForm } from "@/hooks/use-form";
import { CameraIcon } from "@phosphor-icons/react";
import { useState } from "react";
import SaveModal from "./modals/save-modal";
import { ProfileFormDataModel } from "./types";
import { handleNumberKeyDown, formatPhoneNumber } from "@/hooks/format-number";

const Profile = () => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const { formData, isShowErrors, handleChange, handleSubmit } =
    useForm<ProfileFormDataModel>({
      initialData: {
        name: "",
        role: "",
        email: "",
        phone: "",
      },
      validationRules: {
        name: (value) => value.trim() !== "",
        email: (value) => value.trim() !== "",
      },
    });

  const handleProfileSave = () => {
    handleSubmit(() => setIsSaveModalOpen(true));
  };

  return (
    <>
      <div className="flex flex-col gap-3.5 border-b pb-8 border-b-[#eeeeee]">
        <h3 className="Heading-3">프로필 설정</h3>
        <div className="flex flex-col gap-8">
          <div className="relative">
            <div className="flex items-center justify-center rounded-full w-[72px] h-[72px] bg-primary-8 border border-primary Me_Body-3 text-primary">
              JG
            </div>
            <div className="absolute top-11 left-11 flex items-center justify-center w-[33px] h-[33px] rounded-full border border-lg text-sv bg-white z-20">
              <CameraIcon size={16} weight="fill" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder=""
                label="이름"
                value={formData.name}
                onChange={(value) => handleChange("name", value)}
                showError={isShowErrors}
              />
              <Input
                placeholder="시스템 관리자"
                label="권한"
                value={formData.role}
                onChange={(value) => handleChange("role", value)}
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="yoo@gmail.com"
                label="이메일"
                value={formData.email}
                onChange={(value) => handleChange("email", value)}
                showError={isShowErrors}
              />
              <Input
                placeholder=""
                label="연락처"
                value={formData.phone}
                onChange={(value) =>
                  handleChange("phone", formatPhoneNumber(value))
                }
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
            onClick={handleProfileSave}
          />
        </div>
      </div>

      {/* 모달 */}
      {isSaveModalOpen && (
        <SaveModal onClose={() => setIsSaveModalOpen(false)} />
      )}
    </>
  );
};

export default Profile;
