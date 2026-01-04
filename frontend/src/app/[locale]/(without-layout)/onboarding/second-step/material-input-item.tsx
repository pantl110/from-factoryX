import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import {
  UseFormRegister,
  useWatch,
  Control,
  UseFormSetValue,
} from 'react-hook-form';
import { SecondStepFormDataModel } from '../types';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface MaterialInputItemProps {
  plusMode?: boolean;
  onDelete?: () => void;
  register: UseFormRegister<SecondStepFormDataModel>;
  control: Control<SecondStepFormDataModel>;
  setValue: UseFormSetValue<SecondStepFormDataModel>;
  index: number;
}

// 숫자 포맷팅 함수 (000,000 형식)
const formatNumberWithComma = (value: string | number): string => {
  if (!value || value === 0) return '';
  const stringValue = String(value);
  const numbers = stringValue.replace(/[^0-9]/g, '');
  if (!numbers) return '';
  return parseInt(numbers, 10).toLocaleString();
};

// 콤마 제거 함수
const removeComma = (value: string): string => {
  return value.replace(/,/g, '');
};

const MaterialInputItem = ({
  plusMode = true,
  onDelete,
  register,
  control,
  setValue,
  index,
}: MaterialInputItemProps) => {
  const t = useTranslations('onboarding.secondStep');
  const tCommon = useTranslations('common');
  const [displayQuantity, setDisplayQuantity] = useState('');

  // 현재 값을 가져오기 위해 useWatch 사용
  const currentQuantity = useWatch({
    control,
    name: `materials.${index}.usageQuantity`,
  });

  // 실시간으로 displayQuantity 업데이트
  useEffect(() => {
    if (
      currentQuantity !== undefined &&
      currentQuantity !== null &&
      currentQuantity !== 0
    ) {
      const formattedValue = formatNumberWithComma(currentQuantity);
      setDisplayQuantity(formattedValue);
    } else {
      setDisplayQuantity('');
    }
  }, [currentQuantity]);

  // 입력값 변경 핸들러
  const handleQuantityChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value } = e.target;
    const numericValue = removeComma(value);

    // 숫자와 소수점 한자리까지 허용
    if (numericValue === '' || /^\d+(\.\d{0,1})?$/.test(numericValue)) {
      const formattedValue = formatNumberWithComma(numericValue);
      setDisplayQuantity(formattedValue);

      // 실제 값은 숫자로 변환하여 저장 (소수점 포함)
      const numberValue = numericValue ? parseFloat(numericValue) : 0;
      setValue(`materials.${index}.usageQuantity`, numberValue, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 p-5 border border-lg rounded-xl shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-2.5">
        <div className="flex gap-2.5">
          <div className="flex-1">
            <Input
              label={tCommon('materialName')}
              type="text"
              placeholder={tCommon('placeholders.materialName')}
              required={true}
              {...register(`materials.${index}.materialName`)}
            />
          </div>
          <div className="flex-1">
            <Input
              label={tCommon('materialCode')}
              type="text"
              placeholder={tCommon('placeholders.materialCode')}
              required={true}
              {...register(`materials.${index}.materialCode`)}
            />
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <Input
              label={tCommon('specification')}
              type="text"
              placeholder={t('placeholders.spec')}
              required={true}
              {...register(`materials.${index}.spec`)}
            />
          </div>
          <div className="flex-1">
            <Input
              label={tCommon('unit')}
              type="text"
              placeholder={t('placeholders.unit')}
              required={true}
              {...register(`materials.${index}.unit`)}
            />
          </div>
          <div className="flex-1">
            <Input
              label={tCommon('usageQuantity')}
              type="text"
              placeholder={t('placeholders.usageQuantity')}
              required={true}
              value={displayQuantity}
              onChange={handleQuantityChange}
              onBlur={(e) => {
                // blur 시에만 register의 onBlur 호출
                const numericValue = removeComma(e.target.value);
                const numberValue = numericValue ? parseFloat(numericValue) : 0;
                setValue(`materials.${index}.usageQuantity`, numberValue, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </div>
        </div>
      </div>

      {plusMode && (
        <div className="flex justify-end">
          <MiniBtn
            text={tCommon('delete')}
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={onDelete}
          />
        </div>
      )}
    </div>
  );
};

export default MaterialInputItem;
