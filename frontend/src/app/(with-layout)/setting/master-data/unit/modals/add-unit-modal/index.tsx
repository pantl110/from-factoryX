import Modal from '@/ui/modal/modal';
import { useForm } from 'react-hook-form';
import Input from '@/ui/input';
import { CaretDown, Equals, WarningCircle } from '@phosphor-icons/react';
import MiniBtn from '@/ui/mini-btn';
import { handleQuantityInput } from '@/utils/format-number';
import DecimalRuleDropdown from './decimal-rule-dropdown';
import { useState } from 'react';
import Preview from './preview';
import { MaterialNameDropdown } from '@/ui/dropdown/material-name-dropdown';
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import {
  MaterialResponseModel,
  ProductResponseModel,
} from '@/types/data-model';

interface AddUnitModalProps {
  onClose: () => void;
  addUnitType: 'material' | 'product';
}

export const AddUnitModal = ({ onClose, addUnitType }: AddUnitModalProps) => {
  const { register, handleSubmit, watch, setValue } = useForm();
  const [isDecimalRuleDropdownOpen, setIsDecimalRuleDropdownOpen] =
    useState(false);
  const [selectedDecimalRule, setSelectedDecimalRule] = useState('반올림');
  const [materialSearchInput, setMaterialSearchInput] = useState('');
  const [productSearchInput, setProductSearchInput] = useState('');
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  // 단위 필드 값 감시
  const watchedUnit = watch('unit');
  const watchedConversionUnit = watch('conversionUnit');
  const watchedUnitValue = watch('unitValue');
  const watchedConversionValue = watch('conversionValue');

  const onSubmit = (_data: Record<string, unknown>) => {
    // TODO: Implement form submission logic
    onClose();
  };

  // 숫자 입력 핸들러 (콤마 포맷팅)
  const handleNumberChange =
    (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setValue('unit', material.unit);
    setIsMaterialDropdownOpen(false);
    setMaterialSearchInput(material.name);
  };

  const handleSelectProduct = (product: ProductResponseModel) => {
    setValue('name', product.name);
    setValue('code', product.code);
    setValue('unit', product.unit);
    setIsProductDropdownOpen(false);
    setProductSearchInput(product.name);
  };

  return (
    <Modal title="단위 추가" width="w-[800px]" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder={
                  addUnitType === 'material'
                    ? '자재명을 입력하세요.'
                    : '제품명을 입력하세요.'
                }
                label={addUnitType === 'material' ? '자재명' : '제품명'}
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
                label={addUnitType === 'material' ? '자재코드' : '제품코드'}
                {...register('code', { required: true })}
                disabledReadOnly
                placeholder=""
              />
            </div>
            <div className="flex-1">
              <Input
                label="단위"
                {...register('unit', { required: true })}
                disabledReadOnly
                placeholder=""
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              label="기준단위"
              value={watchedUnit || ''}
              disabledReadOnly
              placeholder=""
            />
            <Input
              placeholder={'변환단위을 입력하세요.'}
              label="변환단위"
              {...register('conversionUnit', { required: true })}
            />
          </div>

          <div className="px-4 py-2 flex gap-1 rounded-[8px] bg-bg items-center">
            <div className="w-4 h-4 flex items-center justify-center">
              <WarningCircle size={16} className="text-sv" />
            </div>
            <span className="text-sv Re_Body-2">
              단위와 기준단위는 같은 의미입니다.
            </span>
          </div>
        </div>

        {/* 변환식 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-end">
            <div className="flex gap-2 flex-1 items-end">
              <div className="flex-1">
                <Input
                  placeholder={'숫자를 입력하세요.'}
                  label="변환식"
                  value={watchedUnitValue || ''}
                  onChange={handleNumberChange('unitValue')}
                  name="unitValue"
                />
              </div>
              <div className="flex-[0.5]">
                <Input
                  value={watchedUnit || ''}
                  disabledReadOnly
                  placeholder=""
                />
              </div>
            </div>
            <div className="flex justify-center pb-[19px]">
              <Equals size={16} className="text-sv" />
            </div>
            <div className="flex gap-2 flex-1">
              <div className="flex-1">
                <Input
                  placeholder={'숫자를 입력하세요.'}
                  value={watchedConversionValue || ''}
                  onChange={handleNumberChange('conversionValue')}
                  name="conversionValue"
                />
              </div>
              <div className="flex-[0.5]">
                <Input
                  value={watchedConversionUnit || ''}
                  disabledReadOnly
                  placeholder=""
                />
              </div>
            </div>
            <div className="flex-[0.5] flex flex-col gap-2 relative">
              <div className="flex items-center gap-1 h-5">
                <label htmlFor="decimal-rule" className="Me_Body-1 text-dg">
                  소수점 규칙
                </label>
              </div>
              <MiniBtn
                text={selectedDecimalRule}
                variant="whiteOutline"
                height="h-12"
                icon={CaretDown}
                iconPosition="right"
                justifyBetween={true}
                width="w-full"
                onClick={() => setIsDecimalRuleDropdownOpen(true)}
                id="decimal-rule"
              />
              {isDecimalRuleDropdownOpen && (
                <div className="absolute top-full left-0 z-10 mt-2">
                  <DecimalRuleDropdown
                    onClose={() => setIsDecimalRuleDropdownOpen(false)}
                    onSelect={(rule) => setSelectedDecimalRule(rule)}
                  />
                </div>
              )}
            </div>
          </div>

          <Preview
            standardUnit={watchedUnit || ''}
            conversionUnit={watchedConversionUnit || ''}
            standardValue={parseNumericValue(watchedUnitValue || '')}
            conversionValue={parseNumericValue(watchedConversionValue || '')}
            decimalRule={selectedDecimalRule}
          />
        </div>

        <div className="flex justify-end gap-2.5">
          <MiniBtn text="닫기" variant="white" onClick={onClose} />
          <MiniBtn text="단위 추가" variant="primary" onClick={onClose} />
        </div>
      </form>
    </Modal>
  );
};
