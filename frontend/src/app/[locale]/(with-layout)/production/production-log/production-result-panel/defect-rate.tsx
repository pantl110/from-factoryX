'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo, useEffect } from 'react';
import Input from '@/ui/input';
import { handleQuantityInput, handleIntegerInput } from '@/utils';

interface DefectRateProps {
  onError?: (text: string, subtext: string) => void;
  initialDefectQuantity?: number | null;
  onDefectQuantityChange?: (defectQuantity: number | null) => void;
  totalProductionQuantity?: number; // 생산 지시 수량
  onTotalProductionQuantityChange?: (quantity: number) => void; // 총 생산 수량 변경 시 생산 지시 수량 업데이트
}

export const DefectRate = ({
  onError,
  initialDefectQuantity = null,
  onDefectQuantityChange,
  totalProductionQuantity = 0,
  onTotalProductionQuantityChange,
}: DefectRateProps) => {
  const t = useTranslations('production.defectRate');
  const [totalProduction, setTotalProduction] = useState<string>(() => {
    if (totalProductionQuantity > 0) {
      const result = handleQuantityInput(totalProductionQuantity.toString());
      return result.displayValue;
    }
    return '';
  });
  const [defectQuantity, setDefectQuantity] = useState<string>(() => {
    // initialDefectQuantity가 null/undefined가 아니고 숫자이면 표시 (0 포함)
    if (
      initialDefectQuantity !== undefined &&
      initialDefectQuantity !== null &&
      typeof initialDefectQuantity === 'number'
    ) {
      // 0도 유효한 값이므로 명시적으로 "0"으로 표시
      if (initialDefectQuantity === 0) {
        return '0';
      }
      const result = handleIntegerInput(initialDefectQuantity.toString());
      return result.displayValue;
    }
    return '';
  });

  // 생산 지시 수량이 변경되면 총 생산 수량에 자동 반영
  // 단, 사용자가 직접 총 생산 수량을 수정한 경우는 제외
  const [isUserEditingTotalProduction, setIsUserEditingTotalProduction] =
    useState(false);

  useEffect(() => {
    // 사용자가 직접 수정 중이 아닐 때만 자동 동기화
    if (!isUserEditingTotalProduction) {
      if (totalProductionQuantity > 0) {
        const result = handleQuantityInput(totalProductionQuantity.toString());
        setTotalProduction(result.displayValue);
      } else {
        setTotalProduction('');
      }
    }
  }, [totalProductionQuantity, isUserEditingTotalProduction]);

  // 총 생산 수량의 숫자 값
  const totalProductionNumeric = useMemo(() => {
    return handleQuantityInput(totalProduction).numericValue;
  }, [totalProduction]);

  // 불량 수량의 숫자 값 (정수만)
  const defectQuantityNumeric = useMemo(() => {
    return handleIntegerInput(defectQuantity).numericValue;
  }, [defectQuantity]);

  // 불량 수량이 변경될 때 부모 컴포넌트에 알림
  // 빈 문자열이면 null, 그 외에는 숫자 값 전달
  useEffect(() => {
    const valueToSend = defectQuantity === '' ? null : defectQuantityNumeric;
    onDefectQuantityChange?.(valueToSend);
  }, [defectQuantity, defectQuantityNumeric, onDefectQuantityChange]);

  // 양품 수량 계산: 총 생산 수량 - 불량 수량
  const goodQuantity = useMemo(() => {
    // 둘 다 입력되어야 계산 결과 표시
    if (!totalProduction || !defectQuantity) return '-';

    const good = totalProductionNumeric - defectQuantityNumeric;
    if (good <= 0) return '0';
    return good.toLocaleString('en-US');
  }, [
    totalProduction,
    defectQuantity,
    totalProductionNumeric,
    defectQuantityNumeric,
  ]);

  // 불량률 계산: (불량 수량 / 총 생산 수량) * 100
  const defectRate = useMemo(() => {
    // 둘 다 입력되어야 계산 결과 표시
    if (!totalProduction || !defectQuantity) return '-';

    if (totalProductionNumeric === 0) return '0%';
    const rate = (defectQuantityNumeric / totalProductionNumeric) * 100;
    return `${rate.toFixed(2)}%`;
  }, [
    totalProduction,
    defectQuantity,
    totalProductionNumeric,
    defectQuantityNumeric,
  ]);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">{t('title')}</h3>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            label={t('totalProductionQuantity')}
            type="text"
            value={totalProduction}
            onChange={(e) => {
              setIsUserEditingTotalProduction(true);
              const result = handleQuantityInput(e.target.value);
              setTotalProduction(result.displayValue);
              // 총 생산 수량이 변경되면 생산 지시 수량도 업데이트
              onTotalProductionQuantityChange?.(result.numericValue);
            }}
            onBlur={() => {
              setIsUserEditingTotalProduction(false);
            }}
            placeholder={t('totalProductionQuantityPlaceholder')}
          />
          <Input
            label={t('defectQuantity')}
            type="text"
            value={defectQuantity}
            onChange={(e) => {
              const inputValue = e.target.value;
              const result = handleIntegerInput(inputValue);
              const newDefectNumeric = result.numericValue;

              // 총 생산 수량이 있고, 불량 수량이 생산 수량보다 큰 경우
              if (
                totalProduction &&
                newDefectNumeric > totalProductionNumeric
              ) {
                setDefectQuantity('');
                onError?.(
                  t('errors.defectQuantityCheck'),
                  t('errors.defectQuantityExceedsTotal')
                );
                return;
              }

              // 사용자가 값을 지운 경우(빈 문자열)는 빈 값으로 유지
              if (inputValue === '' || inputValue.trim() === '') {
                setDefectQuantity('');
                return;
              }

              // 사용자가 명시적으로 0을 입력한 경우 "0"으로 표시
              // inputValue에 숫자가 있고 numericValue가 0이면 "0" 입력으로 간주
              const hasNumber = /[0-9]/.test(inputValue);
              const displayValue =
                hasNumber && newDefectNumeric === 0 ? '0' : result.displayValue;
              setDefectQuantity(displayValue);
            }}
            placeholder={t('defectQuantityPlaceholder')}
          />
        </div>
        <div className="flex gap-2">
          <Input
            label={t('goodQuantity')}
            type="text"
            value={goodQuantity}
            disabled
          />
          <Input
            label={t('defectRate')}
            type="text"
            value={defectRate}
            disabled
          />
        </div>
      </div>
    </div>
  );
};
