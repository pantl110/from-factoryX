import { ProductResponseModel, ProductModel } from '@/types/data-model'
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown'
import InfoLabelValue from '@/ui/info-label-value'
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { useForm, Controller } from 'react-hook-form'

interface ProductInfoProps {
  formData: ProductModel
  productId: number | null
  productList: ProductResponseModel[]
  onValueChange?: (value: Partial<ProductModel>) => void
  onIsDirtyChange?: (isDirty: boolean) => void
  onIsValidChange?: (isValid: boolean) => void
  onClick?: () => void
}

export interface ProductInfoModel {
  getValues: () => ProductModel
}

const ProductInfo = forwardRef<ProductInfoModel, ProductInfoProps>(
  ({ formData, productId, productList, onValueChange, onIsDirtyChange, onIsValidChange }, ref) => {
    // React Hook Form 사용
    const {
      control,
      setValue,
      watch,
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

    // 드롭다운 상태 관리
    const [isProductNameDropdownOpen, setIsProductNameDropdownOpen] = useState(false)

    // product prop이 바뀌면 폼 전체를 reset으로 초기화
    useEffect(() => {
      // 현재 폼 값과 새로운 formData를 비교해서 실제로 변경되었을 때만 reset
      const currentValues = getValues()
      const hasSignificantChange =
        currentValues.name !== formData.name ||
        currentValues.code !== formData.code ||
        currentValues.unit !== formData.unit ||
        currentValues.spec !== formData.spec ||
        currentValues.factory !== formData.factory

      if (hasSignificantChange) {
        reset(formData)
        // reset 후 isDirty를 false로 설정하고 부모에게 알림
        if (onIsDirtyChange) {
          onIsDirtyChange(false)
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId])

    // 드롭다운 필터링 로직
    const matchedItems = productList
      .filter((item) => item.name.toLowerCase().includes(watch().name?.toLowerCase() || ''))
      .slice(0, 6)

    // 드롭다운에서 선택 시 setValue로 여러 필드 한번에 설정
    const handleSelectProduct = (item: ProductResponseModel) => {
      // React Hook Form의 setValue 사용
      setValue('name', item.name)
      setValue('code', item.code)
      setValue('spec', item.spec)
      setValue('unit', item.unit)
      setValue('current_stock', item.current_stock)
      setValue('average_production_time', item.average_production_time)
      setValue('note', item.note)

      // 드롭다운 닫기
      setIsProductNameDropdownOpen(false)

      // 부모 컴포넌트에도 알림
      if (onValueChange) {
        onValueChange({
          name: item.name,
          code: item.code,
          spec: item.spec,
          unit: item.unit,
          current_stock: item.current_stock,
          average_production_time: item.average_production_time,
          note: item.note,
        })
      }
    }

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
                onFocus={() => {
                  if (watch().name && matchedItems.length > 0) {
                    setIsProductNameDropdownOpen(true)
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setIsProductNameDropdownOpen(false), 150)
                }}
                value={field.value}
                onChange={(e) => {
                  field.onChange(e)
                }}
              />
            )}
          />
          {isProductNameDropdownOpen && matchedItems.length > 0 && (
            <div className="absolute left-[134px] top-12 z-10">
              <ProductNameDropdown
                items={matchedItems}
                onSelect={handleSelectProduct}
                width="w-[326px]"
              />
            </div>
          )}
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
