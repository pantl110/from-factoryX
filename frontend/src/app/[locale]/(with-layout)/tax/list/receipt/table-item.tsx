import { PublishedDocumentOutModel } from '@/types/data-model';
import { getProductNamesDisplay } from '@/utils/get-product-names-display';
import { AccountsStatusMap, AccountsStatusColorMap } from '@/types/status-type';
import { RoundChip, MiniBtn, IconBtn } from '@/ui';
import { ArrowLineUpRight } from '@phosphor-icons/react';
import useMemberStore from '@/store/member-store';
import Checkbox from '@/ui/checkbox';
import { useTranslations } from 'next-intl';

interface TableItemProps {
  item: PublishedDocumentOutModel;
  onClick?: () => void;
  onToggle?: () => void;
  isChecked?: boolean;
}

const TableItem = ({
  item,
  onClick,
  onToggle = () => {},
  isChecked = false,
}: TableItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const isProdManager = role === 'prod_manager';
  const { account } = item;
  const tList = useTranslations('tax.list');
  const tCommon = useTranslations('common');

  // 채권 상태 가져오기
  const accountStatus = account?.status || 'waiting';
  const statusText =
    AccountsStatusMap[accountStatus as keyof typeof AccountsStatusMap] ||
    tList('status.waiting');
  const statusColor =
    AccountsStatusColorMap[accountStatus as keyof typeof AccountsStatusColorMap]
      ?.color || 'gray';

  const handleRowClick = () => {
    onClick?.();
  };

  return (
    <div
      className="flex items-center border-b border-lg h-14 w-full min-w-[1192px] text-bl Me_Body-1 hover:bg-bg transition-colors duration-200 cursor-pointer"
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
    >
      <Checkbox
        isChecked={isChecked}
        onToggle={onToggle}
        disabled={isProdManager || isViewer}
      />
      <div className="pl-2 pr-4 w-[192px]">
        <RoundChip text={statusText} variant="sm" color={statusColor} />
      </div>
      <p className="flex-[1.5] px-3 text-dg truncate" title={item.client_name}>
        {item.client_name}
      </p>
      <p
        className="flex-[1.5] px-3 text-dg truncate"
        title={getProductNamesDisplay(
          item.item_name
            ? item.item_name.split(',').map((s: string) => s.trim())
            : []
        )}
      >
        {getProductNamesDisplay(
          item.item_name
            ? item.item_name.split(',').map((s: string) => s.trim())
            : []
        )}
      </p>
      <p
        className="flex-[1.5] px-3 text-dg truncate"
        title={item.total_amount.toLocaleString()}
      >
        {item.total_amount.toLocaleString()}
      </p>
      <p
        className="flex-[1.5] px-3 text-dg truncate"
        title={account?.outstanding_balance?.toLocaleString() || '0'}
      >
        {account?.outstanding_balance?.toLocaleString() || '0'}
      </p>
      <div className="px-3 flex-[1.5]">
        {account?.project ? (
          <IconBtn
            icon={ArrowLineUpRight}
            iconSize={20}
            size="w-9 h-9"
            onClick={(e) => {
              e?.stopPropagation();
            }}
            hoverBg="hover:bg-wh"
          />
        ) : (
          <MiniBtn
            text={tCommon('link')}
            variant="hoverWhite"
            height="h-8"
            onClick={(e) => {
              e.stopPropagation();
            }}
            disabled={role === 'viewer' || role === 'prod_manager'}
          />
        )}
      </div>
    </div>
  );
};

export default TableItem;
