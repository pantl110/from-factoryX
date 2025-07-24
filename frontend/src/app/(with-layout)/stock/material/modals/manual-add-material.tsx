import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { useForm } from 'react-hook-form';
import { MaterialDataModel } from '@/types/data-model';

interface ManualAddMaterialProps {
  setIsManualAddMode: (v: boolean) => void;
  setSelectedMaterials: (
    fn: (prev: MaterialDataModel[]) => MaterialDataModel[]
  ) => void;
}

const ManualAddMaterial = ({
  setIsManualAddMode,
  setSelectedMaterials,
}: ManualAddMaterialProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MaterialDataModel>({
    defaultValues: {
      id: crypto.randomUUID(),
      materialName: '',
      size: '',
      usageQuantity: null,
    },
    mode: 'onBlur',
  });

  const onSubmit = (data: MaterialDataModel) => {
    setSelectedMaterials((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        materialName: String(data.name),
        size: String(data.spec),
        usageQuantity: Number(data.quantity),
        unitPrice: Number(data.price),
        unit: data.unit,
      },
    ]);
    reset();
    window.setTimeout(() => setIsManualAddMode(false), 0);
  };

  return (
    <div className="flex flex-col gap-3 border border-lg rounded-[12px] p-5 shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2.5">
          <div className="flex w-full gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="EX) 투명 필름지"
                label="자재명"
                required
                {...register('name', {
                  required: true,
                  validate: (v: unknown) => typeof v === 'string' && !!v.trim(),
                })}
                showError={!!errors.name}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="EX) 123456"
                label="자재코드"
                required
                {...register('code', {
                  required: true,
                  validate: (v: unknown) => typeof v === 'string' && !!v.trim(),
                })}
                showError={!!errors.code}
              />
            </div>
          </div>
          <div className="flex w-full gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="EX) 500mm × 100m"
                label="규격"
                required
                {...register('spec', {
                  required: true,
                  validate: (v: unknown) => typeof v === 'string' && !!v.trim(),
                })}
                showError={!!errors.spec}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="EX) EA"
                label="단위"
                required
                {...register('unit', {
                  required: true,
                  validate: (v: unknown) => typeof v === 'string' && !!v.trim(),
                })}
                showError={!!errors.unit}
              />
            </div>
          </div>
          <div className="flex w-full gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="EX) 100"
                label="수량"
                required
                type="text"
                {...register('quantity', {
                  required: true,
                  validate: (v) => !isNaN(Number(v)) && Number(v) > 0,
                  setValueAs: (v) =>
                    v === '' ? null : Number(v.replace(/[^0-9]/g, '')),
                })}
                onChange={(e) => {
                  const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                  e.target.value = onlyNums;
                }}
                showError={!!errors.quantity}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="EX) 1,000"
                label="단가"
                type="text"
                required
                {...register('price', {
                  required: true,
                  validate: (v) => !isNaN(Number(v)) && Number(v) > 0,
                  setValueAs: (v) =>
                    v === '' ? null : Number(v.replace(/[^0-9]/g, '')),
                })}
                onChange={(e) => {
                  const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                  e.target.value = onlyNums;
                }}
                showError={!!errors.price}
              />
            </div>
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

export default ManualAddMaterial;
