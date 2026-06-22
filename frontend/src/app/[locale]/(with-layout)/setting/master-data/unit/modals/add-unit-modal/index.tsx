import Modal from '@/ui/modal/modal';
import { useForm } from 'react-hook-form';
import Input from '@/ui/input';
import { Equals } from '@phosphor-icons/react';
import MiniBtn from '@/ui/mini-btn';
import { handleQuantityInput } from '@/utils/format-number';
import { useEffect, useState } from 'react';
import Preview from './preview';
import { MaterialNameDropdown } from '@/ui/dropdown/material-name-dropdown';
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import {
  MaterialResponseModel,
  ProductResponseModel,
  UnitConversionModel,
} from '@/types/data-model';
import { useCreateUnitConversionMutation } from '@/hooks';
import { useTranslations } from 'next-intl';

interface AddUnitModalProps {
  onClose: () => void;
  addUnitType: 'material' | 'product';
  refetchUnit?: () => Promise<void>;
  // 특정 단위변환 레코드를 수정/재사용할 때 기본값으로 사용
  initialUnit?: UnitConversionModel | null;
}

export const AddUnitModal = ({
  onClose,
  addUnitType,
  refetchUnit,
  initialUnit = null,
}: AddUnitModalProps) => {
  const { register, handleSubmit, watch, setValue } = useForm();
  const [materialSearchInput, setMaterialSearchInput] = useState('');
  const [productSearchInput, setProductSearchInput] = useState('');
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(
    null
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const createMutation = useCreateUnitConversionMutation();
  const tCommon = useTranslations('common');
  const tUnit = useTranslations('setting.masterData.unit');

  // initialUnit이 있을 때 모달 기본값 설정
  useEffect(() => {
    if (!initialUnit) return;

    // 이름 / 코드 / ID
    if (addUnitType === 'material') {
      setMaterialSearchInput(initialUnit.material_name || '');
      setSelectedMaterialId(initialUnit.material ?? null);
      setValue('name', initialUnit.material_name || '');
    } else {
      setProductSearchInput(initialUnit.product_name || '');
      setSelectedProductId(initialUnit.product ?? null);
      setValue('name', initialUnit.product_name || '');
    }
    // 코드 정보: 백엔드에서 material_code / product_code 로 내려옴
    if (addUnitType === 'material') {
      setValue('code', initialUnit.material_code || '');
    } else {
      setValue('code', initialUnit.product_code || '');
    }

    // 단위/수량 기본값
    if (initialUnit.from_unit) {
      setValue('unit', initialUnit.from_unit);
    }
    if (initialUnit.to_unit) {
      setValue('conversionUnit', initialUnit.to_unit);
    }
    // from_quantity / to_quantity 는 Decimal 이라 문자열일 수도 있어서 타입 상관없이 처리
    if (
      initialUnit.from_quantity !== undefined &&
      initialUnit.from_quantity !== null
    ) {
      const formatted = handleQuantityInput(String(initialUnit.from_quantity));
      setValue('unitValue', formatted.displayValue);
    }
    if (
      initialUnit.to_quantity !== undefined &&
      initialUnit.to_quantity !== null
    ) {
      const formatted = handleQuantityInput(String(initialUnit.to_quantity));
      setValue('conversionValue', formatted.displayValue);
    }
  }, [initialUnit, addUnitType, setValue]);

  // 단위 필드 값 감시
  const watchedUnit = watch('unit');
  const watchedConversionUnit = watch('conversionUnit');
  const watchedUnitValue = watch('unitValue');
  const watchedConversionValue = watch('conversionValue');

  const onSubmit = async () => {
    try {
      const fromValue = parseNumericValue(watchedUnitValue || '');
      const toValue = parseNumericValue(watchedConversionValue || '');

      if (fromValue === 0 || toValue === 0) {
        alert(tUnit('errors.enterConversionValue'));
        return;
      }

      if (!watchedConversionUnit) {
        alert(tUnit('errors.enterConversionUnit'));
        return;
      }

      const conversionRate = Math.round((toValue / fromValue) * 10000) / 10000; // 소수점 4자리까지 반올림

      await createMutation.mutateAsync({
        // id 가 있으면 수정 모드, 없으면 null 로 전송
        id: initialUnit?.id ?? null,
        material_id: addUnitType === 'material' ? selectedMaterialId : null,
        product_id: addUnitType === 'product' ? selectedProductId : null,
        from_unit: watchedUnit || null,
        to_unit: watchedConversionUnit || null,
        // 변환식 숫자도 함께 전송
        from_quantity: fromValue,
        to_quantity: toValue,
        conversion_rate: conversionRate,
      });

      // useCreateUnitConversionMutation의 onSuccess에서 이미 쿼리를 invalidate하므로
      // refetchUnit이 있으면 추가로 refetch하고, 없으면 자동으로 새로고침됨
      if (refetchUnit) {
        await refetchUnit();
      }
      onClose();
    } catch {
      alert(tUnit('errors.addFailed'));
    }
  };

  // 숫자 입력 핸들러 (콤마 포맷팅)
  const handleNumberChange =
    (fieldName: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const result = handleQuantityInput(e.target.value);
      setValue(fieldName, result.displayValue);
    };

  // 콤마 제거하고 숫자로 변환하는 함수
  const parseNumericValue = (value: string): number => {
    if (!value) return 0;
    const cleanValue = value.replace(/,/g, '');
    return parseFloat(cleanValue) || 0;
  };

  // 선택 핸들러
  const handleSelectMaterial = (material: MaterialResponseModel) => {
    setValue('name', material.name);
    setValue('code', material.code);
    // 자재일 경우: 기준단위는 사용자 입력, 변환단위에 자재 단위 자동 설정
    setValue('conversionUnit', material.unit);
    setSelectedMaterialId(material.id);
    setIsMaterialDropdownOpen(false);
    setMaterialSearchInput(material.name);
  };

  const handleSelectProduct = (product: ProductResponseModel) => {
    setValue('name', product.name);
    setValue('code', product.code);
    // 제품일 경우: 기준단위에 제품 단위 자동 설정
    setValue('unit', product.unit);
    setSelectedProductId(product.id);
    setIsProductDropdownOpen(false);
    setProductSearchInput(product.name);
  };

  return (
    <Modal title={tUnit('title')} width="w-[800px]" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder={
                  addUnitType === 'material'
                    ? tCommon('placeholders.materialName')
                    : tCommon('placeholders.productName')
                }
                label={
                  addUnitType === 'material'
                    ? tCommon('materialName')
                    : tCommon('productName')
                }
                value={
                  addUnitType === 'material'
                    ? materialSearchInput
                    : productSearchInput
                }
                onChange={(e) => {
                  const { value } = e.target;
                  if (addUnitType === 'material') {
                    setMaterialSearchInput(value);
                    if (value.length > 0) {
                      setIsMaterialDropdownOpen(true);
                    } else {
                      setIsMaterialDropdownOpen(false);
                    }
                  } else {
                    setProductSearchInput(value);
                    if (value.length > 0) {
                      setIsProductDropdownOpen(true);
                    } else {
                      setIsProductDropdownOpen(false);
                    }
                  }
                }}
                onFocus={() => {
                  if (
                    addUnitType === 'material' &&
                    materialSearchInput.length > 0
                  ) {
                    setIsMaterialDropdownOpen(true);
                  } else if (
                    addUnitType === 'product' &&
                    productSearchInput.length > 0
                  ) {
                    setIsProductDropdownOpen(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (addUnitType === 'material') {
                      setIsMaterialDropdownOpen(false);
                    } else {
                      setIsProductDropdownOpen(false);
                    }
                  }, 150);
                }}
              />
              {addUnitType === 'material' &&
                isMaterialDropdownOpen &&
                materialSearchInput.length > 0 && (
                  <div className="absolute top-full left-0 z-50 mt-2 w-full">
                    <MaterialNameDropdown
                      searchTerm={materialSearchInput}
                      onSelect={handleSelectMaterial}
                      onClose={() => setIsMaterialDropdownOpen(false)}
                      width="w-full"
                    />
                  </div>
                )}
              {addUnitType === 'product' &&
                isProductDropdownOpen &&
                productSearchInput.length > 0 && (
                  <div className="absolute top-full left-0 z-50 mt-2 w-full">
                    <ProductNameDropdown
                      searchTerm={productSearchInput}
                      onSelect={handleSelectProduct}
                      onClose={() => setIsProductDropdownOpen(false)}
                      width="w-full"
                    />
                  </div>
                )}
            </div>

            <div className="flex-1">
              <Input
                label={
                  addUnitType === 'material'
                    ? tCommon('materialCode')
                    : tCommon('productCode')
                }
                {...register('code', { required: true })}
                disabledReadOnly
                placeholder=""
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              label={tUnit('standardUnit')}
              placeholder={
                addUnitType === 'material'
                  ? tUnit('placeholders.standardUnit')
                  : ''
              }
              value={watchedUnit || ''}
              disabled={addUnitType === 'product'}
              {...(addUnitType === 'material'
                ? register('unit', { required: true })
                : {})}
            />
            <Input
              placeholder={
                addUnitType === 'material'
                  ? ''
                  : tUnit('placeholders.conversionUnit')
              }
              label={tUnit('conversionUnit')}
              value={watchedConversionUnit || ''}
              disabled={addUnitType === 'material'}
              {...(addUnitType === 'product'
                ? register('conversionUnit', { required: true })
                : {})}
            />
          </div>
        </div>

        {/* 변환식 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-end">
            <div className="flex gap-2 flex-1 items-end">
              <div className="flex-1">
                <Input
                  placeholder={tCommon('placeholders.enterNumber')}
                  label={tUnit('conversionFormula')}
                  value={watchedUnitValue || ''}
                  onChange={handleNumberChange('unitValue')}
                  name="unitValue"
                />
              </div>
              <div className="flex-[0.5]">
                <Input value={watchedUnit || ''} disabled placeholder="" />
              </div>
            </div>
            <div className="flex justify-center pb-[19px]">
              <Equals size={16} className="text-sv" />
            </div>
            <div className="flex gap-2 flex-1">
              <div className="flex-1">
                <Input
                  placeholder={tCommon('placeholders.enterNumber')}
                  value={watchedConversionValue || ''}
                  onChange={handleNumberChange('conversionValue')}
                  name="conversionValue"
                />
              </div>
              <div className="flex-[0.5]">
                <Input
                  value={watchedConversionUnit || ''}
                  disabled
                  placeholder=""
                />
              </div>
            </div>
          </div>

          <Preview
            addUnitType={addUnitType}
            standardUnit={watchedUnit || ''}
            conversionUnit={watchedConversionUnit || ''}
            standardValue={parseNumericValue(watchedUnitValue || '')}
            conversionValue={parseNumericValue(watchedConversionValue || '')}
          />
        </div>

        <div className="flex justify-end gap-2.5">
          <MiniBtn text={tCommon('close')} variant="gray" onClick={onClose} />
          <MiniBtn
            text={tUnit('convert')}
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending}
          />
        </div>
      </form>
    </Modal>
  );
};
