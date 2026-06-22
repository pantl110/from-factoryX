import { MaterialItemModel } from '@/types/data-model';
import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { handleQuantityInput } from '@/utils/format-number';
import { useTranslations } from 'next-intl';

interface ManualAddMaterialProps {
  noPrice?: boolean;
  setIsManualAddMode: (v: boolean) => void;
  setNewMaterials: (
    fn: (prev: MaterialItemModel[]) => MaterialItemModel[]
  ) => void;
  checkDuplicateMaterialCode?: (code: string) => Promise<boolean>; // 비동기 중복 검사 함수
  existingMaterials?: string[]; // 기존 자재 코드 목록
  selectedMaterials?: MaterialItemModel[]; // 이미 선택된 자재 목록
  showToast?: (text: string, subtext: string) => void;
  usageQuantity?: boolean;
}

const ManualAddMaterial = ({
  noPrice = true,
  setIsManualAddMode,
  setNewMaterials,
  checkDuplicateMaterialCode, // 비동기 중복 검사 함수
  existingMaterials = [],
  selectedMaterials = [],
  showToast,
  usageQuantity = false,
}: ManualAddMaterialProps) => {
  const t = useTranslations('stock.material.modals.manualAdd');
  const tCommon = useTranslations('common');
  // 각 필드의 값을 직접 관리
  const [formValues, setFormValues] = useState({
    name: '',
    code: '',
    spec: '',
    unit: '',
    quantity: null as number | null,
    price: null as number | null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
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

  // 수동으로 유효성 검사
  const isFormValid = () => {
    const { name, code, spec, unit, quantity, price } = formValues;
    const baseValidation =
      name.trim() &&
      code.trim() &&
      spec.trim() &&
      unit.trim() &&
      quantity !== null &&
      quantity > 0;

    if (noPrice) {
      return baseValidation;
    }

    return baseValidation && price !== null && price > 0;
  };

  const onSubmit = async (data: MaterialItemModel) => {
    // 중복 검사
    // 1. 비동기 함수가 있으면 사용
    if (checkDuplicateMaterialCode) {
      const isDuplicate = await checkDuplicateMaterialCode(data.code);
      if (isDuplicate) {
        showToast?.(
          t('toast.duplicateCode.text'),
          t('toast.duplicateCode.subtext')
        );
        setError('code', {
          type: 'manual',
          message: t('errors.duplicateCode'),
        });
        return;
      }
    }
    // 2. 기존 자재 코드 목록에서 확인
    if (existingMaterials.includes(data.code)) {
      showToast?.(
        t('toast.duplicateCode.text'),
        t('toast.duplicateCode.subtext')
      );
      setError('code', {
        type: 'manual',
        message: t('errors.duplicateCode'),
      });
      return;
    }
    // 3. 이미 선택된 자재 목록에서 확인
    if (selectedMaterials.some((mat) => mat.code === data.code)) {
      showToast?.(
        t('toast.alreadyAdded.text'),
        t('toast.alreadyAdded.subtext')
      );
      setError('code', {
        type: 'manual',
        message: t('errors.alreadyAdded'),
      });
      return;
    }

    setNewMaterials((prev) => [
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
    window.setTimeout(() => setIsManualAddMode(false), 0);
  };

  return (
    <div className="mb-4 flex flex-col gap-3 border border-lg rounded-[12px] p-5 shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
      <form data-scope="manual-add-material" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2.5">
          <div className="flex w-full gap-2.5">
            <div className="flex-1">
              <Input
                placeholder={t('placeholders.materialName')}
                label={tCommon('materialName')}
                required
                {...register('name', {
                  required: true,
                  validate: (v: unknown) => {
                    const str = String(v || '');
                    return !!str.trim();
                  },
                })}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="flex-1">
              <Input
                showError={!!errors.code}
                placeholder="EX) 123456"
                label={tCommon('materialCode')}
                required
                {...register('code', {
                  required: true,
                  validate: (v: unknown) => {
                    const str = String(v || '');
                    return !!str.trim();
                  },
                })}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, code: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex w-full gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="EX) 500mm × 100m"
                label={tCommon('specification')}
                required
                {...register('spec', {
                  required: true,
                  validate: (v: unknown) => {
                    const str = String(v || '');
                    return !!str.trim();
                  },
                })}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, spec: e.target.value }))
                }
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="EX) EA"
                label={tCommon('unit')}
                required
                {...register('unit', {
                  required: true,
                  validate: (v: unknown) => {
                    const str = String(v || '');
                    return !!str.trim();
                  },
                })}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, unit: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex w-full gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="EX) 100"
                label={
                  usageQuantity ? tCommon('usageQuantity') : tCommon('quantity')
                }
                required
                type="text"
                {...register('quantity', {
                  required: true,
                  validate: (v) => {
                    const regex = usageQuantity ? /[^0-9.]/g : /[^0-9]/g;
                    const num = Number(String(v).replace(regex, ''));
                    return !isNaN(num) && num > 0;
                  },
                  setValueAs: (v) => {
                    if (v === '' || v === null || v === undefined) return null;
                    const regex = usageQuantity ? /[^0-9.]/g : /[^0-9]/g;
                    const num = Number(String(v).replace(regex, ''));
                    return num === 0 ? null : num;
                  },
                })}
                onChange={(e) => {
                  const result = handleQuantityInput(e.target.value);

                  // usageQuantity가 false면 소수점 제거
                  let processedValue = result.displayValue;
                  let processedNumericValue = result.numericValue;

                  if (!usageQuantity && processedValue.includes('.')) {
                    processedValue = processedValue.replace(/\.\d+/, '');
                    processedNumericValue = Math.floor(processedNumericValue);
                  }

                  // 입력 필드에 포맷된 값 표시
                  e.target.value = processedValue;

                  // formValues 업데이트
                  const num =
                    result.isValid && processedNumericValue > 0
                      ? processedNumericValue
                      : null;
                  setFormValues((prev) => ({ ...prev, quantity: num }));
                }}
              />
            </div>
            {!noPrice && (
              <div className="flex-1">
                <Input
                  placeholder="EX) 1,000"
                  label={tCommon('unitPrice')}
                  required
                  type="text"
                  {...register('price', {
                    required: true,
                    validate: (v) => {
                      const num = Number(String(v).replace(/[^0-9]/g, ''));
                      return !isNaN(num) && num > 0;
                    },
                    setValueAs: (v) => {
                      if (v === '' || v === null || v === undefined)
                        return null;
                      const num = Number(String(v).replace(/[^0-9]/g, ''));
                      return num === 0 ? null : num;
                    },
                  })}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                    const formatted = onlyNums
                      ? parseInt(onlyNums).toLocaleString()
                      : '';
                    e.target.value = formatted;

                    const num = onlyNums ? parseInt(onlyNums) : null;
                    setFormValues((prev) => ({ ...prev, price: num }));
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-3">
          <MiniBtn
            text={tCommon('cancel')}
            variant="gray"
            type="button"
            onClick={() => setIsManualAddMode(false)}
          />
          <MiniBtn
            text={tCommon('add')}
            variant="primary"
            type="submit"
            disabled={!isFormValid()}
          />
        </div>
      </form>
    </div>
  );
};

export default ManualAddMaterial;
