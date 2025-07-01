import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { SecondStepFormDataModel } from "../types";

interface MaterialInputItemProps {
  plusMode?: boolean;
  onDelete?: () => void;
  register: UseFormRegister<SecondStepFormDataModel>;
  errors: FieldErrors<SecondStepFormDataModel>;
  index: number;
}

const MaterialInputItem = ({
  plusMode = true,
  onDelete,
  register,
  errors,
  index,
}: MaterialInputItemProps) => {
  return (
    <div className="w-full flex flex-col gap-3 p-5 border border-lg rounded-xl shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
      <div className="flex gap-2.5 flex-1">
        <div className="flex-2">
          <Input
            label="자재명"
            type="text"
            placeholder="자재명 입력"
            required={true}
            {...(register && { ...register(`materialName_${index}`) })}
            showError={!!errors?.[`materialName_${index}`]}
          />
        </div>
        <div className="flex-2">
          <Input
            label="규격"
            type="text"
            placeholder="규격 입력"
            required={true}
            {...(register && { ...register(`size_${index}`) })}
            showError={!!errors?.[`size_${index}`]}
          />
        </div>
        <div className="flex-1">
          <Input
            label="사용 수량"
            type="number"
            placeholder="EX) 100"
            required={true}
            {...(register && {
              ...register(`usageQuantity_${index}`, { valueAsNumber: true }),
            })}
            showError={!!errors?.[`usageQuantity_${index}`]}
          />
        </div>
      </div>
      {plusMode && (
        <div className="flex justify-end">
          <MiniBtn
            text="삭제하기"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={onDelete}
          />
        </div>
      )}
    </div>
  );
};

export default MaterialInputItem;
