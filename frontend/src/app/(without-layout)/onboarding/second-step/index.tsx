import InfoLabelValue from "@/ui/info-label-value";
import MiniBtn from "@/ui/mini-btn";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import MaterialInputItem from "./material-input-item";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

interface SecondStepProps {
  onNextStep: () => void;
  onPrevStep: () => void;
}

// Yup 스키마 정의
const createValidationSchema = (materialCount: number) => {
  const materialFields: Record<string, yup.StringSchema> = {};

  for (let i = 0; i < materialCount; i++) {
    materialFields[`materialName_${i}`] = yup.string().required();
    materialFields[`size_${i}`] = yup.string().required();
    materialFields[`usageQuantity_${i}`] = yup.string().required();
  }

  return yup.object(materialFields);
};

const SecondStep = ({ onNextStep, onPrevStep }: SecondStepProps) => {
  const [materialItems, setMaterialItems] = useState<number[]>([]); // 초기 아이템 0개

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm({
    resolver: yupResolver(createValidationSchema(materialItems.length + 1)), // +1 for the first item
    mode: "onChange",
  });

  const handleAddMaterial = () => {
    clearErrors(); // 유효성 검사 에러 상태를 초기화
    setMaterialItems((prev) => [...prev, prev.length]);
  };
  const handleDeleteMaterial = (index: number) => {
    setMaterialItems((prev) => prev.filter((_, i) => i !== index));
  };
  const onSubmit = () => {
    onNextStep();
  };

  return (
    <div className="bg-wh z-1 w-[800px] py-10 px-8 flex flex-col gap-7 items-center rounded-lg max-h-full">
      <div className="flex flex-col gap-8 w-full">
        {/* 타이틀 영역 */}
        <div className="flex flex-col gap-2 items-center">
          <h3 className="Heading-3 text-primary">
            해당 품목을 만들 때 필요한 원자재를 추가해 주세요.
          </h3>
          <div className="Me_Body-2 text-bl text-center">
            운영을 시작하려면 먼저 품목과 설비 정보를 등록해야 해요.
            <br />
            등록이 완료되면 생산부터 재고까지 한눈에 관리할 수 있어요!
          </div>
        </div>

        {/* 표 영역  */}
        <div className="w-full">
          <div className="flex">
            <InfoLabelValue label="품목명" value="투명아크릴판" />
            <InfoLabelValue label="품목코드" value="12345" />
          </div>
          <div className="flex">
            <InfoLabelValue label="규격" value="100x300mm" />
            <InfoLabelValue label="단위" value="EA" />
          </div>
        </div>
      </div>

      {/* input container */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">
        <div className="flex flex-col gap-2 overflow-y-auto">
          <MaterialInputItem
            plusMode={false}
            register={register}
            errors={errors}
            index={0}
          />
          {materialItems.map((item, index) => (
            <MaterialInputItem
              key={item}
              onDelete={() => handleDeleteMaterial(index)}
              register={register}
              errors={errors}
              index={index + 1}
            />
          ))}
          <button
            type="button"
            onClick={handleAddMaterial}
            className="w-full h-12 min-h-8 flex gap-2 items-center justify-center bg-bg Re_Body-1 text-sv border border-[#E4E4E7] rounded shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:bg-primary-8 hover:text-dg"
          >
            추가하기
            <Plus size={24} />
          </button>
        </div>
        {/* 모달버튼 영역 */}
        <div className="w-full flex justify-end gap-2.5">
          <MiniBtn
            text="이전 단계"
            textColor="text-sv"
            bgColor="bg-wh"
            hoverColor="bg-bg"
            onClick={onPrevStep}
            type="button"
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
  );
};

export default SecondStep;
