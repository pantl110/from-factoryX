import { CaretDown } from '@phosphor-icons/react';
import Checkbox from '@/ui/checkbox';
import useMemberStore from '@/store/member-store';
import { TaxDocumentType, AccountsStatusColorMap } from '@/types/status-type';
import { RoundChip } from '@/ui/round-chip';
import { useTranslations } from 'next-intl';

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
  const tList = useTranslations('tax.list');
  const tInfo = useTranslations('tax.list.info');
  const tCommon = useTranslations('common');

  // 매입세금계산서 또는 현금영수증일 때만 "미지급금액(잔액)", 그 외에는 "미수금액(잔액)"
  const outstandingLabel =
    taxType === 'purchase' || taxType === null
      ? tInfo('labels.amountPayable')
      : tInfo('labels.amountReceivable');
  const projectLabel =
    taxType === 'purchase' || taxType === null
      ? tList('tableHeader.projectLink.purchase')
      : tList('tableHeader.projectLink.sales');
  const accountStatusLabel =
    taxType === 'purchase' || taxType === null
      ? tInfo('statusLabel.purchase')
      : tInfo('statusLabel.sales');

  const getAccountStatusChip = (status?: string) => {
    return (
      <>
        <p className="text-sv">{accountStatusLabel}</p>
        {!status ? (
          <RoundChip text={tCommon('all')} variant="sm" color="whiteOutline" />
        ) : (
          (() => {
            const statusKey = status as keyof typeof AccountsStatusColorMap;
            const colorMap = AccountsStatusColorMap[statusKey];
            if (!colorMap) {
              return (
                <RoundChip
                  text={tCommon('all')}
                  variant="sm"
                  color="whiteOutline"
                />
              );
            }
            return (
              <RoundChip
                text={tList('status.' + statusKey)}
                variant="sm"
                color={
                  colorMap.color as 'gray' | 'orange' | 'blue' | 'red'
                }
              />
            );
          })()
        )}
      </>
    );
  };

  return (
    <div
      className={`text-sv flex items-center w-full h-12 border-t border-b border-lg Me_Body-3 ${
        taxType === 'sales' ? 'min-w-[1360px]' : 'min-w-[1192px]'
      }`}
    >
      {hasItems && (
        <Checkbox
          isChecked={isAllChecked}
          onToggle={onToggleAll}
          disabled={isProdManager || isViewer}
        />
      )}
      <div
        className="w-[192px] px-3 h-full flex justify-between items-center cursor-pointer relative hover:bg-bg transition-colors duration-200"
        onClick={onAccountStatusClick}
      >
        <div className="flex items-center gap-2">
          {getAccountStatusChip(selectedAccountStatus)}
        </div>
        <CaretDown size={16} weight="fill" className="text-sv" />
      </div>
      <p className="flex-[1.5] px-3">{tCommon('clientName')}</p>
      <p className="flex-[1.5] px-3">{tCommon('productName')}</p>
      <p className="flex-[1.5] px-3">{tInfo('labels.totalBilledAmount')}</p>
      <p className="flex-[1.5] px-3">{outstandingLabel}</p>
      {taxType === 'sales' && (
        <p className="flex-[1.5] px-3">{tInfo('labels.invoiceSent')}</p>
      )}
      <p className="flex-[1.5] px-3">{projectLabel}</p>
    </div>
  );
};

export default TableHeader;
