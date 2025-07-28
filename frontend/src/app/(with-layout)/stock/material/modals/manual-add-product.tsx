import { MaterialModel } from '@/types/data-model';
import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { useForm } from 'react-hook-form';

interface ManualAddProductProps {
  setIsManualAddMode: (v: boolean) => void;
  setSelectedProducts?: (
    fn: (prev: MaterialModel[]) => MaterialModel[]
  ) => void;
}

const ManualAddProduct = ({
  setIsManualAddMode,
  setSelectedProducts,
}: ManualAddProductProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MaterialModel>({
    defaultValues: {
      name: '',
      code: '',
      spec: '',
      unit: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = (data: MaterialModel) => {
    setSelectedProducts?.((prev) => [
      ...prev,
      {
        name: data.name,
        code: data.code,
        spec: data.spec,
        unit: data.unit,
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
          />
        </div>
      </form>
    </div>
  );
};

export default ManualAddProduct;
