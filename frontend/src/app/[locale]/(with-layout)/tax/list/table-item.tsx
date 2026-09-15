import {
  TaxDocumentType,
  getAccountsStatusColor,
  getInvoiceSentColor,
} from '@/types/status-type';
import Checkbox from '@/ui/checkbox';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import { getProductNamesDisplay } from '@/hooks';
import { IconBtn, MiniBtn, RoundChip } from '@/ui';
import useMemberStore from '@/store/member-store';
import router from 'next/router';
import { ArrowLineUpRight } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

interface TableItemProps {
  onItemClick?: () => void;
  item: PublishedTaxInvoiceResponseModel;
  onToggle: () => void;
  isChecked: boolean;
  onOpenLinkProjectModal?: (taxId: number) => void;
  taxType?: TaxDocumentType | null;
}

const TableItem = ({
  onItemClick,
  item,
  onToggle,
  isChecked,
  onOpenLinkProjectModal,
  taxType,
}: TableItemProps) => {
  const t = useTranslations('tax.list.sentStatus');
  const tStatus = useTranslations('tax.list.status');
  const tTaxType = useTranslations('tax.createTaxPanel.taxType');
  const tCommon = useTranslations('common');
  const tRoot = useTranslations();
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const isProdManager = role === 'prod_manager';

  const handleToggle = () => {
    onToggle();
  };

  // 채권 상태 가져오기
  const accountStatus = item.account.status || 'waiting';
  const statusText = tStatus(accountStatus);
  const statusColor = getAccountsStatusColor(accountStatus);
  const taxTypeLabel = tTaxType(
    {
      taxable: 'taxable',
      zero_rated: 'zeroRated',
      exempt: 'exempt',
      mixed: 'mixed',
      unclassified: 'unclassified',
    }[item.tax_type || 'unclassified']
  );

  const handleRowClick = () => {
    onItemClick?.();
  };

  return (
    <div
      className={`flex items-center border-b border-lg h-14 w-full text-bl Me_Body-3 hover:bg-bg transition-colors duration-200 cursor-pointer ${
        taxType === 'sales' ? 'min-w-[1360px]' : 'min-w-[1192px]'
      }`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onItemClick?.();
      }}
    >
      <Checkbox
        isChecked={isChecked}
        onToggle={handleToggle}
        disabled={isProdManager || isViewer}
      />
      <div className="pl-2 pr-4 w-[192px] flex items-center gap-2">
        <RoundChip text={statusText} variant="sm" color={statusColor} />
        <span className="text-sv whitespace-nowrap">{taxTypeLabel}</span>
      </div>
      <p
        className="flex-[1.5] px-3 text-dg truncate"
        title={item.client_info?.name || '-'}
      >
        {item.client_info?.name || '-'}
      </p>
      <p
        className="flex-[1.5] px-3 text-dg truncate"
        title={
          getProductNamesDisplay(
            item.line_items?.map((product) => product.name) || [],
            tRoot
          ) || '-'
        }
      >
        {getProductNamesDisplay(
          item.line_items?.map((product) => product.name) || [],
          tRoot
        ) || '-'}
      </p>
      <p
        className="flex-[1.5] px-3 text-dg truncate"
        title={item.account.total_billed_amount?.toLocaleString() || '0'}
      >
        {item.account.total_billed_amount?.toLocaleString() || '0'}
      </p>
      <p
        className="flex-[1.5] px-3 text-dg truncate"
        title={item.account.outstanding_balance?.toLocaleString() || '0'}
      >
        {item.account.outstanding_balance?.toLocaleString() || '0'}
      </p>
      {item.tax_invoice_type === 'sales' && (
        <div className="pl-2 pr-4 flex-[1.5]">
          <RoundChip
            text={
              item.account.invoice_sent_count === 0
                ? t('notSent')
                : t('sentCount', { count: item.account.invoice_sent_count })
            }
            variant="sm"
            color={
              getInvoiceSentColor(item.account.invoice_sent_count).color ??
              'gray'
            }
          />
        </div>
      )}
      <div className="px-3 flex-[1.5]">
        {item.project_id ? (
          <IconBtn
            icon={ArrowLineUpRight}
            iconSize={20}
            size="w-9 h-9"
            onClick={
              taxType === 'purchase' || taxType === null
                ? (e) => {
                    e?.stopPropagation();
                  }
                : (e) => {
                    e?.stopPropagation();
                    router.push(`/production/${item.project_id}`);
                  }
            }
            hoverBg="hover:bg-wh"
          />
        ) : (
          <MiniBtn
            text={tCommon('link')}
            variant="outline"
            height="h-8"
            onClick={
              taxType === 'purchase' || taxType === null
                ? (e) => {
                    e?.stopPropagation();
                  }
                : (e) => {
                    e.stopPropagation();
                    onOpenLinkProjectModal?.(item.id);
                  }
            }
            disabled={role === 'viewer' || role === 'prod_manager'}
          />
        )}
      </div>
    </div>
  );
};

export default TableItem;
