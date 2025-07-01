import { MaterialDataModel } from "@/mocks/material-data";
import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import { useForm } from "@/hooks/use-form";

interface ManualAddMaterialProps {
  setIsManualAddMode: (v: boolean) => void;
  setSelectedMaterials: (
    fn: (prev: MaterialDataModel[]) => MaterialDataModel[],
  ) => void;
}

const initialMaterial: MaterialDataModel = {
  id: null,
  materialName: "",
  size: "",
  usageQuantity: null,
};

const ManualAddMaterial = ({
  setIsManualAddMode,
  setSelectedMaterials,
}: ManualAddMaterialProps) => {
  const {
    formData: manualMaterial,
    isShowErrors,
    handleChange,
    handleSubmit,
  } = useForm<MaterialDataModel>({
    initialData: initialMaterial,
    validationRules: {
      materialName: (v) => !!v.trim(),
      size: (v) => !!v.trim(),
      usageQuantity: (v) => v !== null && Number(v) > 0,
    },
  });

  return (
    <div className="mt-4 flex flex-col gap-3 border border-lg rounded-[12px] p-5 shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
      <div className="flex gap-2.5">
        <div className="flex-2">
          <Input
            placeholder="자재명 입력"
            label="자재명"
            value={manualMaterial.materialName}
            onChange={(value: string) => handleChange("materialName", value)}
            required
            showError={isShowErrors && !manualMaterial.materialName.trim()}
          />
        </div>
        <div className="flex-2">
          <Input
            placeholder="규격 입력"
            label="규격"
            value={manualMaterial.size}
            onChange={(value: string) => handleChange("size", value)}
            required
            showError={isShowErrors && !manualMaterial.size.trim()}
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="EX) 100"
            label="사용 수량"
            type="number"
            required
            value={
              manualMaterial.usageQuantity !== null
                ? manualMaterial.usageQuantity?.toString()
                : ""
            }
            onChange={(value: string) => handleChange("usageQuantity", value)}
            showError={
              isShowErrors &&
              (manualMaterial.usageQuantity === null ||
                Number(manualMaterial.usageQuantity) <= 0)
            }
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <MiniBtn
          text="취소하기"
          textColor="text-sv"
          hoverColor=""
          onClick={() => setIsManualAddMode(false)}
        />
        <MiniBtn
          text="추가하기"
          textColor="text-primary"
          bgColor="bg-primary-8"
          hoverColor="hover:bg-secondary-hover"
          onClick={() =>
            handleSubmit(() => {
              setSelectedMaterials((prev) => [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  materialName: manualMaterial.materialName,
                  size: manualMaterial.size,
                  usageQuantity: Number(manualMaterial.usageQuantity),
                },
              ]);
              // 폼 리셋
              window.setTimeout(() => setIsManualAddMode(false), 0);
            })
          }
        />
      </div>
    </div>
  );
};

export default ManualAddMaterial;
