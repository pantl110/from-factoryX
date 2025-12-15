import { FacilityPlanResponseModel } from '@/types/data-model';
import { calculateAvgProductionTime, formatISODateTime } from '@/utils';
import { useState } from 'react';
import IconBtn from '@/ui/icon-btn';
import { ArrowLineUpRight } from '@phosphor-icons/react';
import ProductDetail from '@/app/(with-layout)/stock/product/product-detail';

interface FacilityHistoryItemProps {
  plan: FacilityPlanResponseModel;
}

const FacilityHistoryItem = ({ plan }: FacilityHistoryItemProps) => {
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const avgProductionTime = calculateAvgProductionTime(
    plan.start_date,
    plan.end_date,
    plan.quantity
  );

  return (
    <>
      <div className="h-14 flex items-center Me_Body-1 text-dg border-b border-lg cursor-default">
        <div className="flex-1 px-3 flex items-center justify-between gap-1 min-w-0">
          <p className="text-dg truncate" title={plan.product_name || '-'}>
            {plan.product_name || '-'}
          </p>
          <IconBtn
            icon={ArrowLineUpRight}
            size="w-9 h-9"
            iconSize={16}
            onClick={() => setIsProductDetailOpen(true)}
          />
        </div>
        <p className="flex-1 px-3">
          {plan.quantity.toLocaleString()}
          {plan.product_unit && plan.product_unit}
        </p>
        <p className="flex-1 px-3">{formatISODateTime(plan.start_date)}</p>
        <p className="flex-1 px-3">{formatISODateTime(plan.end_date)}</p>
        <p
          className="flex-1 px-3 truncate"
          title={avgProductionTime !== '-' ? `${avgProductionTime}초` : '-'}
        >
          {avgProductionTime !== '-' ? `${avgProductionTime}초` : '-'}
        </p>
      </div>

      {isProductDetailOpen && (
        <ProductDetail
          productId={plan.product_id}
          onClose={() => setIsProductDetailOpen(false)}
        />
      )}
    </>
  );
};

export default FacilityHistoryItem;
