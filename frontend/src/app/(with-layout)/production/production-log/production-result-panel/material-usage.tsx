import { Input, Tooltip } from '@/ui';
import { useTooltip } from '@/hooks';
import { Trash } from '@phosphor-icons/react';
import { SubstituteMaterialDropdown } from './substitute-material-dropdown';
import { useEffect, useState } from 'react';
import { LotDropdown } from './lot-dropdown';

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

  // 전체 삭제 시(상위에서 resetSignal 증가) 첫 행의 표시 값 초기화
  useEffect(() => {
    setSelectedMaterial({
      id: materialId,
      name: materialName,
    });
    setSelectedLotNumber('');
  }, [resetSignal, materialId, materialName]);
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
                onChangeIsSubstitute?.(item.id !== materialId);
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
          type="number"
          value={usageAmount || ''}
          onChange={(e) => {
            const raw = e.target.value;
            const parsed = raw === '' ? 0 : parseFloat(raw);
            onChangeUsage(Number.isNaN(parsed) ? 0 : parsed);
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
