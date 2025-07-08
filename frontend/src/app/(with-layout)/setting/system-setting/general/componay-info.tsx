import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import { useForm } from "react-hook-form";
import { forwardRef } from "react";
import { CompanyFormDataModel } from "./types";
import { InputMask } from "@react-input/mask";
import useToast from "@/hooks/use-toast";
import Toast from "@/ui/toast";
import { CheckCircle } from "@phosphor-icons/react";

const BusinessNumberInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>((props, ref) => (
  <Input
    label="사업자등록번호"
    placeholder="사업자등록번호를 입력하세요."
    ref={ref}
    {...props}
  />
));
BusinessNumberInput.displayName = "BusinessNumberInput";
const PhoneInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>((props, ref) => (
  <Input
    placeholder="전화번호를 입력하세요."
    label="연락처"
    ref={ref}
    {...props}
  />
));
PhoneInput.displayName = "PhoneInput";
const FaxInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>((props, ref) => (
  <Input placeholder="팩스를 입력하세요." label="팩스" ref={ref} {...props} />
));
FaxInput.displayName = "FaxInput";

const CompanyInfo = () => {
  const { isToastOpen, isVisible, showToast } = useToast(2000);

  const { register, handleSubmit } = useForm<CompanyFormDataModel>({
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

  const onSubmit = () => {
    // console.log("회사 정보:", data);
    showToast();
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
            <InputMask
              component={BusinessNumberInput}
              mask="000-00-00000"
              replacement={{ 0: /[0-9]/ }}
              {...register("businessNumber")}
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
            <InputMask
              component={PhoneInput}
              mask="000-0000-0000"
              replacement={{ 0: /[0-9]/ }}
              {...register("managerPhone")}
            />
            <InputMask
              component={FaxInput}
              mask="000-0000-0000"
              replacement={{ 0: /[0-9]/ }}
              {...register("managerFax")}
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

      {/* 토스트 */}
      {isToastOpen && (
        <Toast
          icon={<CheckCircle size={24} className="text-primary" />}
          text="저장이 완료되었어요."
          subtext="입력하신 회사 정보가 업데이트되었어요."
          type="primary"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default CompanyInfo;
