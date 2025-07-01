import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";
import SaveModal from "./modals/save-modal";

// Yup 스키마 정의
const companySchema = yup.object({
  companyName: yup.string().required(),
  businessNumber: yup.string().required(),
  ceoName: yup.string().required(),
  managerEmail: yup.string().email().required(),
  managerPhone: yup.string().optional(),
  managerFax: yup.string().optional(),
  businessType: yup.string().required(),
  businessCategory: yup.string().required(),
  address: yup.string().required(),
});

const CompanyInfo = () => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(companySchema),
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
    mode: "onChange",
  });

  const onSubmit = () =>
    // data: CompanyFormDataModel
    {
      // console.log("회사 정보:", data);
      setIsSaveModalOpen(true);
    };

  return (
    <>
      <div className="flex flex-col py-8 gap-4 border-b border-b-[#eeeeee]">
        <h3 className="Heading-3">회사 정보</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder=""
              label="회사명"
              required
              {...register("companyName")}
              showError={!!errors.companyName}
            />
            <Input
              placeholder=""
              label="사업자등록번호"
              required
              {...register("businessNumber")}
              showError={!!errors.businessNumber}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder=""
              label="대표자명"
              required
              {...register("ceoName")}
              showError={!!errors.ceoName}
            />
            <Input
              placeholder=""
              label="담당자 이메일"
              required
              {...register("managerEmail")}
              showError={!!errors.managerEmail}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder=""
              label="담당자 연락처"
              {...register("managerPhone")}
            />
            <Input
              placeholder=""
              label="담당자 팩스"
              {...register("managerFax")}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder=""
              label="업태"
              required
              {...register("businessType")}
              showError={!!errors.businessType}
            />
            <Input
              placeholder=""
              label="종목"
              required
              {...register("businessCategory")}
              showError={!!errors.businessCategory}
            />
          </div>
          <Input
            placeholder=""
            label="사업장 주소"
            required
            {...register("address")}
            showError={!!errors.address}
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
