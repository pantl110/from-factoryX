import Input from '@/ui/input'
import MiniBtn from '@/ui/mini-btn'
import { useForm } from 'react-hook-form'
import { ProductDataModel } from '@/types/data-model'

interface ManualAddProductProps {
  setIsManualAddMode: (v: boolean) => void
  setSelectedProducts?: (fn: (prev: ProductDataModel[]) => ProductDataModel[]) => void
}

const ManualAddProduct = ({ setIsManualAddMode, setSelectedProducts }: ManualAddProductProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductDataModel>({
    defaultValues: {
      id: null,
      productName: '',
      size: '',
      unit: '',
    },
    mode: 'onBlur',
  })

  const onSubmit = (data: ProductDataModel) => {
    setSelectedProducts?.((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        productName: data.productName,
        size: data.size,
        unit: data.unit,
      },
    ])
    reset()
    setIsManualAddMode(false)
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border border-lg rounded-[12px] p-5 shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-2.5">
          <div className="flex-2">
            <Input
              placeholder="품목명 입력"
              label="품목명"
              required
              {...register('productName', {
                required: true,
                validate: (v) => !!(v || '').trim(),
              })}
              showError={!!errors.productName}
            />
          </div>
          <div className="flex-2">
            <Input
              placeholder="규격 입력"
              label="규격"
              required
              {...register('size', {
                required: true,
                validate: (v) => !!(v || '').trim(),
              })}
              showError={!!errors.size}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="EX) EA"
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
            type="submit"
          />
        </div>
      </form>
    </div>
  )
}

export default ManualAddProduct
