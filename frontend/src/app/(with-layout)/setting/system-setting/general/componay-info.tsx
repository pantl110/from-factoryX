import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import { useForm } from "@/hooks/use-form";
import { useState } from "react";
import SaveModal from "./modals/save-modal";
import { CompanyFormDataModel } from "./types";

const CompanyInfo = () => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const { formData, isShowErrors, handleChange, handleSubmit } =
    useForm<CompanyFormDataModel>({
      initialData: {
        companyName: "",
        businessNumber: "",
        ceoName: "",
        managerEmail: "",
        managerPhone: "",
        managerFax: "",
        businessType: "",
        businessCategory: "",
        address: "",
      },
      validationRules: {
        // companyName: (value) => value.trim() !== "",
        // businessNumber: (value) => value.trim() !== "",
        // ceoName: (value) => value.trim() !== "",
        // managerEmail: (value) => value.trim() !== "",
        // businessType: (value) => value.trim() !== "",
        // businessCategory: (value) => value.trim() !== "",
        // address: (value) => value.trim() !== "",
      },
    });

  const handleCompanySave = () => {
    handleSubmit(() => setIsSaveModalOpen(true));
  };

  return (
    <>
      <div className="flex flex-col py-8 gap-4 border-b border-b-[#eeeeee]">
        <h3 className="Heading-3">회사 정보</h3>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder=""
              label="회사명"
              // required
              value={formData.companyName}
              onChange={(value) => handleChange("companyName", value)}
              showError={isShowErrors}
            />
            <Input
              placeholder=""
              label="사업자등록번호"
              // required
              value={formData.businessNumber}
              onChange={(value) => handleChange("businessNumber", value)}
              showError={isShowErrors}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder=""
              label="대표자명"
              // required
              value={formData.ceoName}
              onChange={(value) => handleChange("ceoName", value)}
              showError={isShowErrors}
            />
            <Input
              placeholder=""
              label="담당자 이메일"
              // required
              value={formData.managerEmail}
              onChange={(value) => handleChange("managerEmail", value)}
              showError={isShowErrors}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder=""
              label="담당자 연락처"
              value={formData.managerPhone}
              onChange={(value) => handleChange("managerPhone", value)}
            />
            <Input
              placeholder=""
              label="담당자 팩스"
              value={formData.managerFax}
              onChange={(value) => handleChange("managerFax", value)}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder=""
              label="업태"
              // required
              value={formData.businessType}
              onChange={(value) => handleChange("businessType", value)}
              showError={isShowErrors}
            />
            <Input
              placeholder=""
              label="종목"
              // required
              value={formData.businessCategory}
              onChange={(value) => handleChange("businessCategory", value)}
              showError={isShowErrors}
            />
          </div>
          <Input
            placeholder=""
            label="사업장 주소"
            // required
            value={formData.address}
            onChange={(value) => handleChange("address", value)}
            showError={isShowErrors}
          />
        </div>
        <div className="flex justify-end">
          <MiniBtn
            text="저장하기"
            textColor="text-primary"
            bgColor="bg-primary-8"
            hoverColor="hover:bg-secondary-hover"
            onClick={handleCompanySave}
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

export default CompanyInfo;
