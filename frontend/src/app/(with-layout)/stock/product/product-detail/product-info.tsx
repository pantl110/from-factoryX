import { ProductModel } from '@/types/data-model'
import InfoLabelValue from '@/ui/info-label-value'
import { useEffect, forwardRef, useImperativeHandle } from 'react'
import { useForm, Controller } from 'react-hook-form'

interface ProductInfoProps {
  formData: ProductModel
  productId: number | null
  onIsDirtyChange?: (isDirty: boolean) => void
  onIsValidChange?: (isValid: boolean) => void
}

export interface ProductInfoModel {
  getValues: () => ProductModel
}

const ProductInfo = forwardRef<ProductInfoModel, ProductInfoProps>(
  ({ formData, productId, onIsDirtyChange, onIsValidChange }, ref) => {
    const {
      control,
      reset,
      formState: { isDirty, isValid },
      getValues,
    } = useForm<ProductModel>({
      defaultValues: formData,
      mode: 'onChange',
    })

    // isDirty 상태가 변경될 때 부모에게 알림
    useEffect(() => {
      if (onIsDirtyChange) {
        onIsDirtyChange(isDirty)
      }
    }, [isDirty, onIsDirtyChange])

    // isValid 상태가 변경될 때 부모에게 알림
    useEffect(() => {
      if (onIsValidChange) {
        onIsValidChange(isValid)
      }
    }, [isValid, onIsValidChange])

    // 부모 컴포넌트에 getValues 메서드 노출
    useImperativeHandle(
      ref,
      () => ({
        getValues: () => getValues(),
      }),
      [getValues]
    )

    // product prop이 바뀌면 폼 전체를 reset으로 초기화
    useEffect(() => {
      reset(formData)
      if (onIsDirtyChange) {
        onIsDirtyChange(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, formData])

    return (
      <div className="flex flex-col border-b border-lg">
        <div className="flex relative">
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label="품목명"
                placeholder="(필수) 품목명을 입력하세요."
                isEditing={true}
                required
                value={field.value}
                onChange={(e) => {
                  field.onChange(e)
                }}
              />
            )}
          />
          <Controller
            name="code"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label="품목 코드"
                placeholder="(필수) 품목 코드를 입력하세요."
                isEditing={true}
                required
                value={field.value}
                onChange={(e) => {
                  field.onChange(e)
                }}
              />
            )}
          />
        </div>
        <div className="flex">
          <Controller
            name="spec"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label="규격"
                placeholder="(필수) 규격을 입력하세요."
                isEditing={true}
                required
                value={field.value}
                onChange={(e) => {
                  field.onChange(e)
                }}
              />
            )}
          />
          <Controller
            name="unit"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InfoLabelValue
                label="단위"
                placeholder="(필수) 단위를 입력하세요."
                isEditing={true}
                required
                value={field.value}
                onChange={(e) => {
                  field.onChange(e)
                }}
              />
            )}
          />
        </div>
        <div className="flex">
          <Controller
            name="current_stock"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="현재 재고"
                value={
                  field.value === undefined || field.value === null
                    ? ''
                    : field.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                isEditing={true}
                placeholder="현재 재고 수량을 입력하세요."
                inputType="text"
                onChange={(e) => {
                  const numValue = e.target.value.replace(/[^0-9]/g, '')
                  // 빈 문자열이면 undefined, 아니면 문자열로 저장
                  field.onChange(numValue === '' ? undefined : Number(numValue))
                }}
              />
            )}
          />
          <Controller
            name="average_production_time"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="평균 생산 시간"
                value={
                  field.value === undefined ||
                    field.value === null ||
                    (typeof field.value === 'string' && field.value === '')
                    ? '-'
                    : `${field.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}초`
                }
                isEditing={false}
                inputType="text"
              />
            )}
          />
        </div>
        <Controller
          name="note"
          control={control}
          render={({ field }) => (
            <InfoLabelValue
              label="특이사항"
              value={field.value || ''}
              isEditing={true}
              textarea={true}
              placeholder="특이사항을 입력하세요."
              onChange={(e) => {
                field.onChange(e)
              }}
            />
          )}
        />
      </div>
    )
  }
)
ProductInfo.displayName = 'ProductInfo'

export default ProductInfo
