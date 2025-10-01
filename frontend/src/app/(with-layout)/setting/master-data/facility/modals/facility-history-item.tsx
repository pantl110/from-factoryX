import { FacilityHistoryResponseModel } from '@/types/data-model';
import { convertUTCToKST } from '@/hooks';

interface FacilityHistoryItemProps {
  history: FacilityHistoryResponseModel;
}

const FacilityHistoryItem = ({ history }: FacilityHistoryItemProps) => {
  return (
    <div className="h-14 flex items-center Me_Body-1 text-dg border-b border-lg cursor-default">
      <p
        className="flex-1 px-3 truncate"
        title={history.quotation_product_name || '-'}
      >
        {history.quotation_product_name || '-'}
      </p>
      <p className="flex-1 px-3">{history.quantity.toLocaleString()}</p>
      <p className="flex-1 px-3">{convertUTCToKST(history.start_date)}</p>
      <p className="flex-1 px-3">{history.avg_production_time}초</p>
      <p className="flex-1 px-3">{convertUTCToKST(history.end_date)}</p>
    </div>
  );
};

export default FacilityHistoryItem;
