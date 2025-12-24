import { CaretDown } from '@phosphor-icons/react';
import Checkbox from '@/ui/checkbox';
import useMemberStore from '@/store/member-store';
import {
  TaxDocumentType,
  AccountsStatusColorMap,
  AccountsStatusMap,
} from '@/types/status-type';
import { RoundChip } from '@/ui/round-chip';

interface TableHeaderProps {
  checkedCount: number;
  onToggleAll: () => void;
  onSortClick: () => void;
  sortDirection: 'asc' | 'desc';
  isAllChecked: boolean;
  taxType?: TaxDocumentType | null;
  selectedAccountStatus?: string | undefined;
  onAccountStatusClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  hasItems?: boolean;
}

const TableHeader = ({
  onToggleAll,
  // onSortClick,
  isAllChecked,
  taxType,
  selectedAccountStatus,
  onAccountStatusClick,
  hasItems = true,
}: TableHeaderProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const isProdManager = role === 'prod_manager';

  // 매입세금계산서 또는 현금영수증일 때만 "미지급금액(잔액)", 그 외에는 "미수금액(잔액)"
  const outstandingLabel =
    taxType === 'purchase' || taxType === null
      ? '미지급금액(잔액)'
      : '미수금액(잔액)';
  const projectLabel =
    taxType === 'purchase' || taxType === null
      ? '발주서 연결'
      : '프로젝트 연결';
  const accountStatusLabel =
    taxType === 'purchase' || taxType === null ? '채무 상태' : '채권 상태';

  const getAccountStatusChip = (status?: string) => {
    return (
      <>
        <p className="text-sv">{accountStatusLabel}</p>
        {!status ? (
          <RoundChip text="전체" variant="sm" color="whiteOutline" />
        ) : (
          (() => {
            const statusKey = status as keyof typeof AccountsStatusColorMap;
            const colorMap = AccountsStatusColorMap[statusKey];
            if (!colorMap) {
              return (
                <RoundChip text="전체" variant="sm" color="whiteOutline" />
              );
            }
            return (
              <RoundChip
                text={AccountsStatusMap[statusKey]}
                variant="sm"
                color={
                  colorMap.color as 'gray' | 'orange' | 'secondary' | 'red'
                }
              />
            );
          })()
        )}
      </>
    );
  };

  return (
    <div className="text-sv flex items-center w-full min-w-[1192px] h-12 border-t border-b border-lg Me_Body-1">
      {hasItems && (
        <Checkbox
          isChecked={isAllChecked}
          onToggle={onToggleAll}
          disabled={isProdManager || isViewer}
        />
      )}
      <div
        className="w-[180px] px-3 h-full flex justify-between items-center cursor-pointer relative hover:bg-bg transition-colors duration-200"
        onClick={onAccountStatusClick}
      >
        <div className="flex items-center gap-2">
          {getAccountStatusChip(selectedAccountStatus)}
        </div>
        <CaretDown size={16} weight="fill" className="text-sv" />
      </div>
      <p className="flex-[1.5] px-3">거래처명</p>
      <p className="flex-[1.5] px-3">제품명</p>
      <p className="flex-[1.5] px-3">청구금액(합계)</p>
      <p className="flex-[1.5] px-3">{outstandingLabel}</p>
      {taxType === 'sales' && <p className="flex-[1.5] px-3">청구서 발송</p>}
      <p className="flex-[1.5] px-3">{projectLabel}</p>
    </div>
  );
};

export default TableHeader;
