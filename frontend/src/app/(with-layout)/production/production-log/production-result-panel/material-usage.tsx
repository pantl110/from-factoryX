import { Input, Tooltip } from '@/ui';
import { useTooltip } from '@/hooks';
import { Trash } from '@phosphor-icons/react';
import { SubstituteMaterialDropdown } from './substitute-material-dropdown';
import { useEffect, useState, useRef } from 'react';
import { LotDropdown } from './lot-dropdown';
import { handleQuantityInput } from '@/utils';
import { useForm, Controller } from 'react-hook-form';

export interface MaterialUsageFormData {
  id?: number;
  material_id: number;
  usage_amount: number;
  material_history_id: number | null;
  material_repackaging_id: number | null;
}

interface MaterialUsageProps {
  originalMaterialId: number;
  originalMaterialName: string;
  materialId: number;
  materialName: string;
  unit: string;
  initialData?: {
    id?: number;
    material_id: number;
    usage_amount: number;
    material_history_id?: number | null;
    material_repackaging_id?: number | null;
    material_name?: string;
    material_history_lot_number?: string | null;
    material_repackaging_lot_number?: string | null;
  };
  onDelete?: () => void;
  canDelete?: boolean;
  onChange?: (data: MaterialUsageFormData) => void;
}

export const MaterialUsage = ({
  originalMaterialId,
  originalMaterialName,
  materialName,
  materialId,
  unit,
  initialData,
  onDelete,
  canDelete = true,
  onChange,
}: MaterialUsageProps) => {
  const { isVisible, onMouseEnter, onMouseLeave } = useTooltip({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLotDropdownOpen, setIsLotDropdownOpen] = useState(false);
  const [currentMaterialName, setCurrentMaterialName] = useState(
    initialData?.material_name ?? materialName
  );
  const [selectedLotNumber, setSelectedLotNumber] = useState(
    initialData?.material_history_lot_number ??
      initialData?.material_repackaging_lot_number ??
      ''
  );

  const { control, watch, setValue, reset } = useForm<MaterialUsageFormData>({
    defaultValues: {
      id: initialData?.id,
      material_id: initialData?.material_id ?? materialId,
      usage_amount:
        typeof initialData?.usage_amount === 'string'
          ? parseFloat(initialData.usage_amount)
          : (initialData?.usage_amount ?? 0),
      material_history_id: initialData?.material_history_id ?? null,
      material_repackaging_id: initialData?.material_repackaging_id ?? null,
    },
  });

  const formData = watch();
  const prevFormDataRef = useRef<MaterialUsageFormData | null>(null);
  const prevInitialDataIdRef = useRef<number | undefined>(undefined);
  const currentMaterialId = watch('material_id');

  // material_id가 변경되면 이름도 동기화
  useEffect(() => {
    if (currentMaterialId === originalMaterialId) {
      setCurrentMaterialName(originalMaterialName);
    }
    // 대체 자재인 경우는 드롭다운에서 선택할 때 이미 업데이트됨
  }, [currentMaterialId, originalMaterialId, originalMaterialName]);

  // 초기 데이터가 실제로 변경되었을 때만 폼 리셋
  useEffect(() => {
    if (initialData) {
      const currentInitialDataId = initialData.id;
      // initialData의 id가 변경되었을 때만 리셋
      if (prevInitialDataIdRef.current === currentInitialDataId) {
        return;
      }
      prevInitialDataIdRef.current = currentInitialDataId;

      const initialUsageAmount =
        typeof initialData.usage_amount === 'string'
          ? parseFloat(initialData.usage_amount)
          : (initialData.usage_amount ?? 0);

      const initialMaterialId = initialData.material_id ?? materialId;
      reset({
        id: initialData.id,
        material_id: initialMaterialId,
        usage_amount: initialUsageAmount,
        material_history_id: initialData.material_history_id ?? null,
        material_repackaging_id: initialData.material_repackaging_id ?? null,
      });

      // 초기 데이터의 자재 이름 업데이트
      if (initialData.material_name) {
        setCurrentMaterialName(initialData.material_name);
      } else if (initialMaterialId === originalMaterialId) {
        setCurrentMaterialName(originalMaterialName);
      }

      setSelectedLotNumber(
        initialData.material_history_lot_number ??
          initialData.material_repackaging_lot_number ??
          ''
      );

      // 투입량 display 값도 업데이트
      if (initialUsageAmount > 0) {
        const result = handleQuantityInput(initialUsageAmount.toString());
        setUsageAmountDisplay(result.displayValue);
      } else {
        setUsageAmountDisplay('');
      }
    } else {
      // initialData가 없으면 이전 id도 초기화
      prevInitialDataIdRef.current = undefined;
    }
  }, [
    initialData,
    materialId,
    originalMaterialId,
    originalMaterialName,
    reset,
  ]);

  // 폼 데이터 변경 시 상위 컴포넌트에 전달 (실제로 변경되었을 때만)
  useEffect(() => {
    const prevData = prevFormDataRef.current;
    const currentData = formData;

    // 이전 데이터와 비교하여 실제로 변경되었을 때만 호출
    if (
      !prevData ||
      prevData.id !== currentData.id ||
      prevData.material_id !== currentData.material_id ||
      prevData.usage_amount !== currentData.usage_amount ||
      prevData.material_history_id !== currentData.material_history_id ||
      prevData.material_repackaging_id !== currentData.material_repackaging_id
    ) {
      prevFormDataRef.current = { ...currentData };
      onChange?.(currentData);
    }
    // onChange는 상위에서 useCallback으로 메모이제이션되어 있어 의존성에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const usageAmount = watch('usage_amount');
  const [usageAmountDisplay, setUsageAmountDisplay] = useState<string>(() => {
    if (usageAmount > 0) {
      const result = handleQuantityInput(usageAmount.toString());
      return result.displayValue;
    }
    return '';
  });

  useEffect(() => {
    if (usageAmount > 0) {
      const result = handleQuantityInput(usageAmount.toString());
      setUsageAmountDisplay(result.displayValue);
    } else {
      setUsageAmountDisplay('');
    }
  }, [usageAmount]);

  return (
    <div className="flex gap-2.5 border-b border-lg pb-5">
      <div className="flex-1 relative">
        <Input
          label="(대체)자재명"
          button
          value={currentMaterialName}
          onClickButton={() => setIsDropdownOpen((prev) => !prev)}
        />
        {isDropdownOpen && (
          <div className="absolute top-21 left-0 w-full z-30">
            <SubstituteMaterialDropdown
              materialId={originalMaterialId}
              materialName={originalMaterialName}
              width="w-full"
              onSelect={(item) => {
                // 자재 이름 업데이트
                setCurrentMaterialName(item.name);
                // 폼의 material_id 업데이트
                setValue('material_id', item.id, { shouldDirty: true });
                // 자재명이 변경되면 기존 LOT 번호는 초기화
                setSelectedLotNumber('');
                setValue('material_history_id', null, { shouldDirty: true });
                setValue('material_repackaging_id', null, {
                  shouldDirty: true,
                });
                setIsDropdownOpen(false);
              }}
              onClose={() => setIsDropdownOpen(false)}
            />
          </div>
        )}
      </div>
      <div className="flex-1 relative">
        <Input
          label="LOT 번호"
          message="입고 시 부여된 고유 LOT 번호"
          button
          value={selectedLotNumber || '-'}
          onClickButton={() => setIsLotDropdownOpen((prev) => !prev)}
        />
        {isLotDropdownOpen && (
          <div className="absolute top-21 left-0 w-full z-30">
            <LotDropdown
              width="w-full"
              materialId={currentMaterialId}
              onClose={() => setIsLotDropdownOpen(false)}
              onSelect={(item) => {
                setSelectedLotNumber(item.name);
                setValue(
                  'material_history_id',
                  item.source === 'history' ? item.id : null
                );
                setValue(
                  'material_repackaging_id',
                  item.source === 'repackaging' ? item.id : null
                );
                setIsLotDropdownOpen(false);
              }}
            />
          </div>
        )}
      </div>
      <div className="flex-1">
        <Controller
          name="usage_amount"
          control={control}
          render={({ field }) => (
            <Input
              label="실제 투입량"
              placeholder="투입량을 입력하세요."
              message="작업자가 실제로 공정에 넣은 양"
              type="text"
              value={usageAmountDisplay}
              onChange={(e) => {
                const result = handleQuantityInput(e.target.value);
                setUsageAmountDisplay(result.displayValue);
                field.onChange(result.numericValue);
              }}
            />
          )}
        />
      </div>
      <div className="flex-[0.4]">
        <Input label="단위" value={unit} disabled />
      </div>
      <div
        className="flex items-center justify-center relative"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <button
          disabled={!canDelete}
          className={`flex items-center justify-center w-12 h-12 rounded-[8px] border border-lg cursor-pointer group transition-colors duration-200 ${!canDelete ? 'bg-lg text-gr' : 'hover:bg-red-8'}`}
        >
          <Trash
            size={22}
            className={`text-sv cursor-pointer ${!canDelete ? '' : 'group-hover:text-red'} transition-colors`}
            onClick={onDelete}
          />
        </button>

        {!canDelete && isVisible && (
          <div className="absolute bottom-[-10px] right-0 w-77">
            <Tooltip
              text="첫 번째 자재 사용 정보는 삭제할 수 없습니다."
              color="red"
              position="right"
            />
          </div>
        )}
      </div>
    </div>
  );
};
