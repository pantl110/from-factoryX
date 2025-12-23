import Chip from '@/ui/chip';
import { UnitConversionModel } from '@/types/data-model';
import { useState } from 'react';
import DeleteModal from '@/ui/modal/delete-modal';
import { useDeleteUnitConversionMutation } from '@/hooks/unit-conversion/use-unit-conversion-api';
import Checkbox from '@/ui/checkbox';

interface UnitTableItemProps {
  unit: UnitConversionModel;
  refetchUnit: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  // 행 클릭 시 단위변환 모달을 열기 위한 콜백
  onRowClick?: (unit: UnitConversionModel) => void;
}
export const UnitTableItem = ({
  unit,
  refetchUnit,
  isSelected = false,
  onToggleSelect,
  onRowClick,
}: UnitTableItemProps) => {
  // item 삭제
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteMutation = useDeleteUnitConversionMutation();
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync((unit as unknown as { id: number }).id);
      setIsDeleteOpen(false);
      refetchUnit();
    } catch {
      // noop - error state is handled in hook consumer or toast layer
    }
  };

  // 소수점 뒤의 불필요한 0 제거하고 포맷팅
  const formatQuantity = (
    value: number | string | null | undefined
  ): string => {
    // 숫자로 변환
    const numValue =
      typeof value === 'number' ? value : parseFloat(String(value || 0));

    // 유효하지 않은 숫자인 경우 처리
    if (isNaN(numValue) || !isFinite(numValue)) {
      return '0';
    }

    // 소수점 4자리까지 표시하되, 뒤의 0은 제거
    const numStr = parseFloat(numValue.toFixed(4)).toString();
    const parts = numStr.split('.');

    // 정수 부분에 천 단위 구분자 추가
    const integerPart = parseInt(parts[0], 10).toLocaleString();

    // 소수점 부분이 있으면 포함, 없으면 정수만 반환
    return parts.length > 1 && parts[1]
      ? `${integerPart}.${parts[1]}`
      : integerPart;
  };

  return (
    <>
      <div
        className="flex h-14 items-center px-3 w-full border-b border-lg Me_Body-1 text-dg hover:bg-bg transition-colors duration-200 cursor-pointer"
        onClick={() => onRowClick?.(unit)}
      >
        <Checkbox
          isChecked={isSelected}
          onToggle={onToggleSelect || (() => {})}
        />
        <div className="flex-[0.6] pl-2 pr-4">
          <Chip
            text={unit.material ? '자재' : '제품'}
            bgColor={unit.material ? 'bg-yellow-8' : 'bg-green-8'}
            textColor={unit.material ? 'text-yellow' : 'text-green'}
            radius="rounded-full"
            padding="px-2.5 py-1"
            height=""
            textStyle="Re_Body-2"
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
        <p className="flex-1 px-3 truncate" title={`${unit.from_unit}`}>
          {unit.from_unit}
        </p>
        <p className="flex-1 px-3 truncate" title={`${unit.to_unit}`}>
          {unit.to_unit}
        </p>
        <p
          className="flex-1 px-3 truncate"
          title={`${formatQuantity(unit.from_quantity)}${unit.from_unit} = ${formatQuantity(unit.to_quantity)}${unit.to_unit}`}
        >
          {`${formatQuantity(unit.from_quantity)}${unit.from_unit} = ${formatQuantity(unit.to_quantity)}${unit.to_unit}`}
        </p>
        {/* <div className="flex-[0.7] px-3">
          <button
            className="w-9 h-9 flex items-center justify-center group"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash
              size={16}
              className="text-sv group-hover:text-red transition-colors cursor-pointer"
            />
          </button>
        </div> */}
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
