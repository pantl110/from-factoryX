import Checkbox from '@/ui/checkbox';
import useMemberStore from '@/store/member-store';
import { TaxDocumentType } from '@/types/status-type';

interface TableHeaderProps {
  checkedCount: number;
  onToggleAll: () => void;
  onSortClick: () => void;
  sortDirection: 'asc' | 'desc';
  isAllChecked: boolean;
  taxType?: TaxDocumentType | null;
}

const TableHeader = ({
  onToggleAll,
  // onSortClick,
  isAllChecked,
  taxType,
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

  return (
    <div className="text-sv flex items-center w-full min-w-[1192px] h-12 border-t border-b border-lg Me_Body-1">
      <Checkbox
        isChecked={isAllChecked}
        onToggle={onToggleAll}
        disabled={isProdManager || isViewer}
      />
      <p className="w-[150px] px-3">채권 상태</p>
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
