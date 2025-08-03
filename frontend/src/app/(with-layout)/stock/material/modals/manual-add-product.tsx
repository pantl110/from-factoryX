import { MaterialItemModel } from '@/types/data-model';
import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { useForm } from 'react-hook-form';

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
  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm<MaterialItemModel>({
    defaultValues: {
      name: '',
      code: '',
      spec: '',
      unit: '',
      quantity: null,
      price: null,
    },
    mode: 'onChange',
  });

  // 모든 필드의 값을 감시
  const watchedValues = watch();

  // 모든 필드가 입력되었는지 확인
  const isFormValid = () => {
    const { name, code, spec, unit } = watchedValues;
    return name?.trim() && code?.trim() && spec?.trim() && unit?.trim();
  };

  const onSubmit = (data: MaterialItemModel) => {
    // 중복 검사
    if (checkDuplicateProductCode && checkDuplicateProductCode(data.code)) {
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
        name: data.name,
        code: data.code,
        spec: data.spec,
        unit: data.unit,
        quantity: data.quantity,
        price: data.price,
      },
    ]);
    reset();
    setIsManualAddMode(false);
  };

  return (
    <div className="mt-4 flex flex-col gap-3 border border-lg rounded-[12px] p-5 shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
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
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-3">
          <MiniBtn
            text="취소"
            textColor="text-sv"
            hoverColor=""
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
