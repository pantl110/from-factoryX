import { MaterialUsageResponseModel } from '@/types/data-model';
import IconBtn from '@/ui/icon-btn';
import { formatDate, removeTrailingZeros } from '@/utils/format-number';
import { ArrowLineUpRight } from '@phosphor-icons/react';

interface MaterialStockOutItemProps {
  usage: MaterialUsageResponseModel;
}

export const MaterialStockOutItem = ({ usage }: MaterialStockOutItemProps) => {
  const formattedDate = usage.plan_end_date
    ? formatDate(new Date(usage.plan_end_date).toISOString().split('T')[0])
    : '-';

  const productName = usage.plan_product_name || '-';
  const clientName = usage.client_name || '-';
  const lotNumber =
    usage.material_history_lot_number ||
    usage.material_repackaging_lot_number ||
    '-';
  const usageAmount = usage.usage_amount
    ? `-${removeTrailingZeros(
        typeof usage.usage_amount === 'string'
          ? usage.usage_amount
          : usage.usage_amount.toString()
      )}${usage.material_unit || ''}`
    : '-';

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-3 cursor-default">
      <p className="flex-1 px-3 text-dg">{formattedDate}</p>
      <div
        className="flex-1 px-3 flex items-center justify-between gap-1 min-w-0"
        title={clientName}
      >
        <p className="text-dg truncate">{clientName}</p>
        <IconBtn
          icon={ArrowLineUpRight}
          size="w-9 h-9"
          iconSize={16}
          onClick={() =>
            window.open(`/production/${usage.project_id}`, '_blank')
          }
        />
      </div>
      <p className="flex-1 px-3 text-dg truncate" title={productName}>
        {productName}
      </p>
      <p className="flex-1 px-3 text-dg">{lotNumber}</p>
      <p className="flex-1 px-3 text-red truncate" title={usageAmount}>
        {usageAmount}
      </p>
    </div>
  );
};
