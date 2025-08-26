import { MaterialItemModel } from '@/types/data-model';
import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { handleQuantityInput } from '@/hooks/format-number';

interface ManualAddProductProps {
  setIsManualAddMode: (v: boolean) => void;
  setSelectedProducts?: (
    fn: (prev: MaterialItemModel[]) => MaterialItemModel[]
  ) => void;
  checkDuplicateProductCode?: (code: string) => boolean;
  showDuplicateProductToast?: () => void;
}

const ManualAddProduct = ({
  setIsManualAddMode,
  setSelectedProducts,
  checkDuplicateProductCode,
  showDuplicateProductToast,
}: ManualAddProductProps) => {
  // 각 필드의 값을 직접 관리
  const [formValues, setFormValues] = useState({
    name: '',
    code: '',
    spec: '',
    unit: '',
    quantity: null as number | null,
  });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<MaterialItemModel>({
    defaultValues: {
      name: '',
      code: '',
      spec: '',
      unit: '',
      quantity: null,
    },
    mode: 'onChange',
  });

  // 수동으로 유효성 검사
  const isFormValid = () => {
    const { name, code, spec, unit, quantity } = formValues;
    return (
      name.trim() &&
      code.trim() &&
      spec.trim() &&
      unit.trim() &&
      quantity !== null &&
      quantity > 0
    );
  };

  const onSubmit = () => {
    // 중복 검사
    if (
      checkDuplicateProductCode &&
      checkDuplicateProductCode(formValues.code)
    ) {
      showDuplicateProductToast?.();
      setError('code', {
        type: 'manual',
        message: '이미 존재하는 품목코드입니다.',
      });
      return;
    }

    setSelectedProducts?.((prev) => [
      ...prev,
      {
        name: formValues.name,
        code: formValues.code,
        spec: formValues.spec,
        unit: formValues.unit,
        quantity: formValues.quantity,
        price: null, // Price is not managed in formValues, so it's null
      },
    ]);
    reset();
    setIsManualAddMode(false);
  };

  return (
    <div className="mb-4 flex flex-col gap-3 border border-lg rounded-[12px] p-5 shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <div className="flex gap-2.5">
          <div className="flex-1">
            <Input
              placeholder="품목명을 입력하세요."
              label="품목명"
              required
              {...register('name', {
                required: true,
                validate: (v) => !!(v || '').trim(),
              })}
              showError={!!errors.name}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="품목코드를 입력하세요."
              label="품목코드"
              required
              {...register('code', {
                required: true,
                validate: (v) => !!(v || '').trim(),
              })}
              showError={!!errors.code}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, code: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex gap-2.5 mt-2.5">
          <div className="flex-1">
            <Input
              placeholder="규격을 입력하세요."
              label="규격"
              required
              {...register('spec', {
                required: true,
                validate: (v) => !!(v || '').trim(),
              })}
              showError={!!errors.spec}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, spec: e.target.value }))
              }
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="단위를 입력하세요."
              label="단위"
              required
              {...register('unit', {
                required: true,
                validate: (v) => !!(v || '').trim(),
              })}
              showError={!!errors.unit}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, unit: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex gap-2.5 mt-2.5">
          <div className="flex-1">
            <Input
              placeholder="EX) 100"
              label="원자재 투입량"
              required
              type="text"
              {...register('quantity', {
                required: true,
                validate: (v) => {
                  const num = Number(String(v).replace(/[^0-9.]/g, ''));
                  return !isNaN(num) && num > 0;
                },
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return null;
                  const num = Number(String(v).replace(/[^0-9.]/g, ''));
                  return num === 0 ? null : num;
                },
              })}
              onChange={(e) => {
                const result = handleQuantityInput(e.target.value);

                // 입력 필드에 포맷된 값 표시
                e.target.value = result.displayValue;

                // formValues 업데이트
                const num =
                  result.isValid && result.numericValue > 0
                    ? result.numericValue
                    : null;
                setFormValues((prev) => ({ ...prev, quantity: num }));
              }}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-3">
          <MiniBtn
            text="취소"
            textColor="text-sv"
            hoverColor="hover:bg-bg"
            onClick={() => setIsManualAddMode(false)}
          />
          <MiniBtn
            text="추가"
            textColor="text-primary"
            bgColor="bg-primary-8"
            hoverColor="hover:bg-secondary-hover"
            type="submit"
            disabled={!isFormValid()}
          />
        </div>
      </form>
    </div>
  );
};

export default ManualAddProduct;
