import Modal from '@/ui/modal/modal';
import { useForm } from 'react-hook-form';
import Input from '@/ui/input';
import { CaretDown, Equals, WarningCircle } from '@phosphor-icons/react';
import MiniBtn from '@/ui/mini-btn';
import { handleQuantityInput } from '@/utils/format-number';
import DecimalRuleDropdown from './decimal-rule-dropdown';
import { useState, useCallback } from 'react';
import Preview from './preview';
import { MaterialNameDropdown } from '@/ui/dropdown/material-name-dropdown';
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import useGetMaterial from '@/hooks/stock/material/use-get-material';
import useGetProduct from '@/hooks/stock/product/use-get-product';
import {
  MaterialResponseModel,
  ProductResponseModel,
} from '@/types/data-model';
import { useInfiniteDropdown } from '@/hooks/use-infinite-dropdown';

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

  // 단위 필드 값 감시
  const watchedUnit = watch('unit');
  const watchedConversionUnit = watch('conversionUnit');
  const watchedUnitValue = watch('unitValue');
  const watchedConversionValue = watch('conversionValue');

  // 데이터 가져오기
  const { getMaterialList } = useGetMaterial();
  const { getProductList } = useGetProduct();

  // 무한 스크롤 드롭다운 (항상 호출하되 조건부로 사용)
  const materialDropdown = useInfiniteDropdown<MaterialResponseModel>(
    materialSearchInput,
    {
      fetchPage: useCallback(
        async ({ q, page, page_size: pageSize }) => {
          const result = await getMaterialList({
            q,
            page,
            page_size: pageSize,
          });
          if (result.success && result.data) {
            return {
              success: true,
              data: {
                data: result.data.data,
                curPage: result.data.curPage ?? page,
                pageCnt:
                  result.data.pageCnt ??
                  Math.ceil(result.data.count / pageSize),
              },
            };
          }
          return { success: false, error: result.error };
        },
        [getMaterialList]
      ),
      pageSize: 6,
    }
  );

  const productDropdown = useInfiniteDropdown<ProductResponseModel>(
    productSearchInput,
    {
      fetchPage: useCallback(
        async ({ q, page, page_size: pageSize }) => {
          const result = await getProductList({ q, page, page_size: pageSize });
          if (result.success && result.data) {
            return {
              success: true,
              data: {
                data: result.data.data,
                curPage: result.data.curPage ?? page,
                pageCnt:
                  result.data.pageCnt ??
                  Math.ceil(result.data.count / pageSize),
              },
            };
          }
          return { success: false, error: result.error };
        },
        [getProductList]
      ),
      pageSize: 6,
    }
  );

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
    materialDropdown.setIsOpen(false);
    setMaterialSearchInput(material.name);
  };

  const handleSelectProduct = (product: ProductResponseModel) => {
    setValue('name', product.name);
    setValue('code', product.code);
    setValue('unit', product.unit);
    productDropdown.setIsOpen(false);
    setProductSearchInput(product.name);
  };

  // Scroll handlers for dropdowns
  const handleMaterialScroll = materialDropdown.onScroll;
  const handleProductScroll = productDropdown.onScroll;

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
                  if (addUnitType === 'material') {
                    setMaterialSearchInput(e.target.value);
                  } else {
                    setProductSearchInput(e.target.value);
                  }
                }}
                onFocus={() => {
                  if (addUnitType === 'material') {
                    materialDropdown.setIsOpen(true);
                  } else {
                    productDropdown.setIsOpen(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (addUnitType === 'material') {
                      materialDropdown.setIsOpen(false);
                    } else {
                      productDropdown.setIsOpen(false);
                    }
                  }, 300);
                }}
              />
              {addUnitType === 'material' &&
                materialDropdown.isOpen &&
                materialDropdown.items.length > 0 && (
                  <div
                    className="absolute top-full left-0 z-10 mt-2 w-full max-h-[200px] overflow-y-auto scrollbar-hide"
                    ref={materialDropdown.containerRef}
                    onScroll={handleMaterialScroll}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <MaterialNameDropdown
                      items={materialDropdown.items}
                      onSelect={handleSelectMaterial}
                      width="w-full"
                    />
                  </div>
                )}
              {addUnitType === 'product' &&
                productDropdown.isOpen &&
                productDropdown.items.length > 0 && (
                  <div
                    className="absolute top-full left-0 z-10 mt-2 w-full max-h-[200px] overflow-y-auto scrollbar-hide"
                    ref={productDropdown.containerRef}
                    onScroll={handleProductScroll}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <ProductNameDropdown
                      items={productDropdown.items}
                      onSelect={handleSelectProduct}
                      onClose={() => productDropdown.setIsOpen(false)}
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
