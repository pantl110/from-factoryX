import { FacilityPlanResponseModel } from '@/types/data-model';
import { convertUTCToKST } from '@/hooks';

interface FacilityHistoryItemProps {
  plan: FacilityPlanResponseModel;
}

const FacilityHistoryItem = ({ plan }: FacilityHistoryItemProps) => {
  return (
    <div className="h-14 flex items-center Me_Body-1 text-dg border-b border-lg cursor-default">
      <p className="flex-1 px-3 truncate" title={plan.product_name || '-'}>
        {plan.product_name || '-'}
      </p>
      <p className="flex-1 px-3">{plan.quantity.toLocaleString()}</p>
      <p className="flex-1 px-3">{convertUTCToKST(plan.start_date)}</p>
      <p className="flex-1 px-3">{plan.avg_production_time}초</p>
      <p className="flex-1 px-3">{convertUTCToKST(plan.end_date)}</p>
    </div>
  );
};

export default FacilityHistoryItem;
