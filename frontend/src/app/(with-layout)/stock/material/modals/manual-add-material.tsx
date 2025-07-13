import Input from '@/ui/input'
import MiniBtn from '@/ui/mini-btn'
import { useForm } from 'react-hook-form'
import { MaterialDataModel } from '@/types/data-model'

interface ManualAddMaterialProps {
  setIsManualAddMode: (v: boolean) => void
  setSelectedMaterials: (fn: (prev: MaterialDataModel[]) => MaterialDataModel[]) => void
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
  })

  const onSubmit = (data: MaterialDataModel) => {
    setSelectedMaterials((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        materialName: data.materialName,
        size: data.size,
        usageQuantity: Number(data.usageQuantity),
      },
    ])
    reset()
    window.setTimeout(() => setIsManualAddMode(false), 0)
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border border-lg rounded-[12px] p-5 shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2.5">
          <div className="flex w-full gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="자재명을 입력하세요."
                label="자재명"
                required
                {...register('materialName', {
                  required: true,
                  validate: (v) => !!v.trim(),
                })}
                showError={!!errors.materialName}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="자재코드를 입력하세요."
                label="자재코드"
                required
                {...register('materialCode', {
                  required: true,
                  validate: (v: unknown) => typeof v === 'string' && !!v.trim(),
                })}
                showError={!!errors.materialCode}
              />
            </div>
          </div>
          <div className="flex w-full gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="규격을 입력하세요."
                label="규격"
                required
                {...register('size', {
                  required: true,
                  validate: (v) => !!v.trim(),
                })}
                showError={!!errors.size}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="사용 수량을 입력하세요."
                label="사용 수량"
                type="number"
                required
                {...register('usageQuantity', {
                  required: true,
                  validate: (v) => v !== null && Number(v) > 0,
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
                showError={!!errors.usageQuantity}
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
  )
}

export default ManualAddMaterial
