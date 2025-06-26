import { MaterialDataModel } from "@/mocks/material-data";
import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";
import { useForm } from "@/hooks/use-form";
import { ProductDataModel } from "@/types/data-model";

interface ManualAddProductProps {
  setIsManualAddMode: (v: boolean) => void;
  setSelectedProducts?: (
    fn: (prev: ProductDataModel[]) => ProductDataModel[],
  ) => void;
}

const initialProduct: ProductDataModel = {
  id: null,
  productName: "",
  size: "",
  unit: "",
};

const ManualAddProduct = ({
  setIsManualAddMode,
  setSelectedProducts,
}: ManualAddProductProps) => {
  const {
    formData: manualProduct,
    showErrors,
    handleChange,
    handleSubmit,
  } = useForm<ProductDataModel>({
    initialData: initialProduct,
    validationRules: {
      productName: (v) => !!(v || "").trim(),
      size: (v) => !!(v || "").trim(),
      unit: (v) => !!(v || "").trim(),
    },
  });
  // 폼 리셋 함수
  const resetForm = () => {
    handleChange("productName", "");
    handleChange("size", "");
    handleChange("unit", "");
  };

  return (
    <div className="mt-4 flex flex-col gap-3 border border-lg rounded-[12px] p-5 shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
      <div className="flex gap-2.5">
        <div className="flex-2">
          <Input
            placeholder="품목명 입력"
            label="품목명"
            value={manualProduct.productName}
            onChange={(value) => handleChange("productName", value)}
            required
            showError={showErrors && !(manualProduct.productName || "").trim()}
          />
        </div>
        <div className="flex-2">
          <Input
            placeholder="규격 입력"
            label="규격"
            value={manualProduct.size}
            onChange={(value) => handleChange("size", value)}
            required
            showError={showErrors && !(manualProduct.size || "").trim()}
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="EX) EA"
            label="단위"
            required
            value={manualProduct.unit}
            onChange={(value) => handleChange("unit", value)}
            showError={
              showErrors &&
              (manualProduct.unit === null || Number(manualProduct.unit) <= 0)
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
              setSelectedProducts?.((prev) => [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  productName: manualProduct.productName,
                  size: manualProduct.size,
                  unit: manualProduct.unit,
                },
              ]);

              // 폼 리셋
              resetForm();
              setIsManualAddMode(false);
            })
          }
        />
      </div>
    </div>
  );
};

export default ManualAddProduct;
