import { Input, Tooltip } from '@/ui';
import { useTooltip } from '@/hooks';
import { Trash } from '@phosphor-icons/react';
import { SubstituteMaterialDropdown } from './substitute-material-dropdown';
import { useEffect, useState } from 'react';
import { LotDropdown } from './lot-dropdown';
import { handleQuantityInput } from '@/utils';

interface MaterialUsageProps {
  materialName: string;
  materialId: number;
  unit: string;
  onDelete?: () => void;
  canDelete?: boolean;
  usageAmount: number;
  onChangeUsage: (value: number) => void;
  onChangeIsSubstitute?: (isSubstitute: boolean) => void;
  resetSignal?: number;
  onChangeSelectedMaterial?: (materialId: number) => void;
  initialLotNumber?: string;
  onChangeSelectedLot?: (lotInfo: {
    lotNumber: string;
    materialHistoryId: number | null;
    materialRepackagingId: number | null;
  }) => void;
}

export const MaterialUsage = ({
  materialName,
  materialId,
  unit,
  onDelete,
  canDelete = true,
  usageAmount,
  onChangeUsage,
  onChangeIsSubstitute,
  resetSignal,
  onChangeSelectedMaterial,
  initialLotNumber,
  onChangeSelectedLot,
}: MaterialUsageProps) => {
  const { isVisible, onMouseEnter, onMouseLeave } = useTooltip({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLotDropdownOpen, setIsLotDropdownOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<{
    id: number;
    name: string;
  }>({
    id: materialId,
    name: materialName,
  });
  const [selectedLotNumber, setSelectedLotNumber] = useState('');
  const [usageAmountDisplay, setUsageAmountDisplay] = useState<string>(() => {
    if (usageAmount > 0) {
      const result = handleQuantityInput(usageAmount.toString());
      return result.displayValue;
    }
    return '';
  });

  // usageAmount가 외부에서 변경되면 displayValue 업데이트
  useEffect(() => {
    if (usageAmount > 0) {
      const result = handleQuantityInput(usageAmount.toString());
      setUsageAmountDisplay(result.displayValue);
    } else {
      setUsageAmountDisplay('');
    }
  }, [usageAmount]);

  // 서버에서 내려온 LOT 번호가 있으면 최초 진입 시 한 번 세팅
  useEffect(() => {
    if (initialLotNumber === null || initialLotNumber === undefined) return;
    setSelectedLotNumber(initialLotNumber);
  }, [initialLotNumber]);

  // 전체 삭제 시(상위에서 resetSignal 증가) 첫 행의 표시 값 초기화
  useEffect(() => {
    // 초기 마운트 시에는 resetSignal이 0이므로 DB에서 내려온 LOT 값(있다면)을 유지
    if (!resetSignal) return;

    setSelectedMaterial({
      id: materialId,
      name: materialName,
    });
    setSelectedLotNumber('');
    onChangeSelectedLot?.({
      lotNumber: '',
      materialHistoryId: null,
      materialRepackagingId: null,
    });
  }, [resetSignal, materialId, materialName, onChangeSelectedLot]);
  return (
    <div className="flex gap-2.5 border-b border-lg pb-5">
      <div className="flex-1 relative">
        <Input
          label="(대체)자재명"
          button
          value={selectedMaterial.name}
          onClickButton={() => setIsDropdownOpen((prev) => !prev)}
        />
        {isDropdownOpen && (
          <div className="absolute top-21 left-0 w-full z-30">
            <SubstituteMaterialDropdown
              materialId={materialId}
              materialName={materialName}
              width="w-full"
              onSelect={(item) => {
                setSelectedMaterial({
                  id: item.id,
                  name: item.name,
                });
                // 자재명이 변경되면 기존 LOT 번호는 초기화
                setSelectedLotNumber('');
                onChangeSelectedLot?.({
                  lotNumber: '',
                  materialHistoryId: null,
                  materialRepackagingId: null,
                });
                onChangeIsSubstitute?.(item.id !== materialId);
                onChangeSelectedMaterial?.(item.id);
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
              materialId={selectedMaterial.id}
              onClose={() => setIsLotDropdownOpen(false)}
              onSelect={(item) => {
                setSelectedLotNumber(item.name);
                onChangeSelectedLot?.({
                  lotNumber: item.name,
                  materialHistoryId: item.source === 'history' ? item.id : null,
                  materialRepackagingId:
                    item.source === 'repackaging' ? item.id : null,
                });
                setIsLotDropdownOpen(false);
              }}
            />
          </div>
        )}
      </div>
      <div className="flex-1">
        <Input
          label="실제 투입량"
          placeholder="투입량을 입력하세요."
          message="작업자가 실제로 공정에 넣은 양"
          type="text"
          value={usageAmountDisplay}
          onChange={(e) => {
            const result = handleQuantityInput(e.target.value);
            setUsageAmountDisplay(result.displayValue);
            onChangeUsage(result.numericValue);
          }}
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
        {/* //   <IconBtn
          //     icon={Trash}
          //     iconSize={22}
          //     size="w-12 h-12"
          //     onClick={onDelete ?? (() => {})}
          //   /> */}

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
