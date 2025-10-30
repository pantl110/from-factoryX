import Chip from '@/ui/chip';
import { Trash } from '@phosphor-icons/react';
import { UnitConversionModel } from '@/types/data-model';
import { useState } from 'react';
import DeleteModal from '@/ui/modal/delete-modal';
import { useDeleteUnitConversionMutation } from '@/hooks/unit-conversion/use-unit-conversion-api';

interface UnitTableItemProps {
  unit: UnitConversionModel;
  refetchUnit: () => void;
}
export const UnitTableItem = ({ unit, refetchUnit }: UnitTableItemProps) => {
  // item 삭제
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteMutation = useDeleteUnitConversionMutation();
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync((unit as unknown as { id: number }).id);
      setIsDeleteOpen(false);
      refetchUnit();
    } catch (e) {
      // noop - error state is handled in hook consumer or toast layer
    }
  };

  // 단위 변환 계산
  const precision = 4; // 소수점 이하 자릿수
  const applyDecimalRule = (
    value: number,
    rule: UnitConversionModel['decimal_rule']
  ) => {
    const factor = Math.pow(10, precision);
    if (rule === 'floor') return Math.floor(value * factor) / factor;
    if (rule === 'ceil') return Math.ceil(value * factor) / factor;
    return Math.round(value * factor) / factor; // 'round'
  };
  const rawRate = (unit.to_quantity || 0) / (unit.from_quantity || 1);
  const conversionRate = applyDecimalRule(rawRate, unit.decimal_rule);
  const conversionRateText = Number.isFinite(conversionRate)
    ? conversionRate
        .toFixed(precision)
        .replace(/\.0+$/, '')
        .replace(/(\.\d*?)0+$/, '$1')
    : '-';

  return (
    <>
      <div className="flex h-14 items-center px-3 w-full border-b border-lg Me_Body-1 text-dg hover:bg-bg transition-colors duration-200 cursor-pointer">
        <div className="flex-1 px-3">
          <Chip
            text={unit.material ? '자재' : '제품'}
            bgColor={unit.material ? 'bg-yellow-8' : 'bg-green-8'}
            textColor={unit.material ? 'text-yellow' : 'text-green'}
            radius="rounded-sm"
          />
        </div>
        <p
          className="flex-1 px-3 truncate"
          title={
            unit.material ? unit.material_name || '-' : unit.product_name || '-'
          }
        >
          {unit.material ? unit.material_name || '-' : unit.product_name || '-'}
        </p>
        <p
          className="flex-1 px-3 truncate"
          title={`${unit.from_unit}/${unit.to_unit}`}
        >
          {unit.from_unit}/{unit.to_unit}
        </p>
        <p
          className="flex-1 px-3 truncate"
          title={`1${unit.from_unit}=${conversionRateText}${unit.to_unit}`}
        >
          1{unit.from_unit}={conversionRateText}
          {unit.to_unit}
        </p>
        <p className="flex-1 px-3">
          {unit.decimal_rule === 'round'
            ? '반올림'
            : unit.decimal_rule === 'floor'
              ? '버림'
              : '올림'}
        </p>
        <div className="flex-[0.4] px-3">
          <button
            className="w-9 h-9 flex items-center justify-center group"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash
              size={16}
              className="text-sv group-hover:text-red transition-colors cursor-pointer"
            />
          </button>
        </div>
      </div>

      {/* item 삭제 모달 */}
      {isDeleteOpen && (
        <DeleteModal
          onClose={() => setIsDeleteOpen(false)}
          onDelete={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      )}
    </>
  );
};
