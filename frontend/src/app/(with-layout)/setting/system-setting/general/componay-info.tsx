import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import { useForm } from "react-hook-form";
import { useState } from "react";
import SaveModal from "./modals/save-modal";
import {
  formatBusinessNumber,
  formatFaxNumber,
  formatPhoneNumber,
} from "@/hooks/format-number";
import { CompanyFormDataModel } from "./types";

const CompanyInfo = () => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const { register, handleSubmit, setValue } = useForm<CompanyFormDataModel>({
    defaultValues: {
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
  });

  const onSubmit = () =>
    // data: CompanyFormData
    {
      // console.log("회사 정보:", data);
      setIsSaveModalOpen(true);
    };
  const handleBusinessNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const formattedValue = formatBusinessNumber(e.target.value);
    setValue("businessNumber", formattedValue);
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setValue("managerPhone", formattedValue);
  };
  const handleFaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatFaxNumber(e.target.value);
    setValue("managerFax", formattedValue);
  };

  return (
    <>
      <div className="flex flex-col py-8 gap-4 border-b border-b-[#eeeeee]">
        <h3 className="Heading-3">회사 정보</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="회사명을 입력하세요."
              label="회사명"
              {...register("companyName")}
            />
            <Input
              placeholder="사업자등록번호(숫자만 입력)"
              label="사업자등록번호"
              {...register("businessNumber")}
              onChange={handleBusinessNumberChange}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="대표자명을 입력하세요."
              label="대표자명"
              {...register("ceoName")}
            />
            <Input
              placeholder="연락 가능한 이메일 주소를 입력하세요."
              label="이메일"
              {...register("managerEmail")}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="전화번호를 입력하세요."
              label="연락처"
              {...register("managerPhone")}
              onChange={handlePhoneChange}
            />
            <Input
              placeholder="팩스번호를 입력하세요."
              label="팩스"
              {...register("managerFax")}
              onChange={handleFaxChange}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="업태를 입력하세요."
              label="업태"
              {...register("businessType")}
            />
            <Input
              placeholder="종목을 입력하세요."
              label="종목"
              {...register("businessCategory")}
            />
          </div>
          <Input
            placeholder="사업장 주소를 입력하세요."
            label="사업장 주소"
            {...register("address")}
          />
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
      </div>

      {/* 모달 */}
      {isSaveModalOpen && (
        <SaveModal onClose={() => setIsSaveModalOpen(false)} />
      )}
    </>
  );
};

export default CompanyInfo;
