// import IconBtn from '@/ui/icon-btn';
// import { ArrowLineUpRight } from '@phosphor-icons/react';
import { MaterialUsageResponseModel } from '@/types/data-model';
import { formatDate, removeTrailingZeros } from '@/utils/format-number';

interface UsageHistoryItemProps {
  usage: MaterialUsageResponseModel;
}

export const UsageHistoryItem = ({ usage }: UsageHistoryItemProps) => {
  const formattedDate = usage.plan_end_date
    ? formatDate(new Date(usage.plan_end_date).toISOString().split('T')[0])
    : '-';

  const productName = usage.plan_product_name || '-';
  const usageAmount = usage.usage_amount
    ? `-${removeTrailingZeros(typeof usage.usage_amount === 'string' ? usage.usage_amount : usage.usage_amount.toString())}${usage.material_unit || '-'}`
    : '-';

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-default group">
      <p className="flex-1 px-3 text-dg">{formattedDate}</p>
      <p className="flex-1 px-3 text-dg">-</p>
      <div
        className="flex-1 px-3 flex items-center justify-between gap-1 min-w-0"
        title={productName}
      >
        <p className="text-dg truncate">{productName}</p>
        {/* <IconBtn
          icon={ArrowLineUpRight}
          size="w-9 h-9"
          iconSize={16}
          onClick={() => {}} // TODO: 품목 클릭 핸들러 추가
          groupHover={true}
        /> */}
      </div>
      <p className="flex-1 px-3 text-red truncate" title={usageAmount}>
        {usageAmount}
      </p>
    </div>
  );
};
