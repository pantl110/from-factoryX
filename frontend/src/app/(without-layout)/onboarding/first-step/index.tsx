import MiniBtn from "@/ui/mini-btn";
import Input from "@/ui/input";
import { useForm } from "react-hook-form";
import { FirstStepFormDataModel } from "../types";

interface FirstStepProps {
  onNextStep: () => void;
  onPrevStep: () => void;
}

const FirstStep = ({ onNextStep, onPrevStep }: FirstStepProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FirstStepFormDataModel>({
    defaultValues: {
      productName: "",
      productCode: "",
      size: "",
      unit: "",
    },
    mode: "onChange",
  });

  const onSubmit = () =>
    // data: FirstStepFormData
    {
      // console.log("폼 데이터:", data);
      onNextStep();
    };

  return (
    <div className="bg-wh z-1 w-[800px] py-10 px-8 flex flex-col items-center rounded-lg">
      <div className="flex flex-col gap-8">
        {/* 타이틀 영역 */}
        <div className="flex flex-col gap-2 items-center">
          <h3 className="Heading-3 text-primary">
            등록할 품목 정보를 입력해주세요.
          </h3>
          <div className="Me_Body-2 text-bl text-center">
            운영을 시작하려면 먼저 품목과 설비 정보를 등록해야 해요.
            <br />
            등록이 완료되면 생산부터 재고까지 한눈에 관리할 수 있어요!
          </div>
        </div>

        {/* input container */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">
          <div className="w-full flex flex-col gap-3 p-5 border border-lg rounded-xl shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2.5 flex-1">
                <Input
                  label="품목명"
                  type="text"
                  placeholder="자재명 입력"
                  required={true}
                  {...register("productName", { required: true })}
                  showError={!!errors.productName}
                />
                <Input
                  label="품목 코드"
                  type="text"
                  placeholder="품목 코드 입력"
                  required={true}
                  {...register("productCode", { required: true })}
                  showError={!!errors.productCode}
                />
              </div>
              <div className="flex gap-2.5 flex-1">
                <Input
                  label="규격"
                  type="text"
                  placeholder="규격 입력"
                  required={true}
                  {...register("size", { required: true })}
                  showError={!!errors.size}
                />
                <Input
                  label="단위"
                  type="text"
                  placeholder="단위 입력"
                  required={true}
                  {...register("unit", { required: true })}
                  showError={!!errors.unit}
                />
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="w-full flex justify-end gap-2.5">
            <MiniBtn
              text="이전 단계"
              textColor="text-sv"
              bgColor="bg-wh"
              hoverColor="bg-bg"
              onClick={onPrevStep}
            />
            <MiniBtn
              text="다음 단계"
              textColor="text-wh"
              bgColor="bg-primary"
              hoverColor="hover:bg-primary-hover"
              type="submit"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default FirstStep;
