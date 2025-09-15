import { FacilityHistoryResponseModel } from '@/types/data-model';

interface FacilityHistoryItemProps {
  history: FacilityHistoryResponseModel;
}

const FacilityHistoryItem = ({ history }: FacilityHistoryItemProps) => {
  return (
    <div className="h-14 flex items-center Me_Body-1 text-dg border-b border-lg cursor-pointer">
      <p
        className="flex-1 px-3 truncate"
        title={history.quotation_product_name || '-'}
      >
        {history.quotation_product_name || '-'}
      </p>
      <p className="flex-1 px-3">{history.quantity.toLocaleString()}</p>
      <p className="flex-1 px-3">
        {history.start_date.split('T')[0]}{' '}
        {history.start_date.split('T')[1]?.split('.')[0]?.slice(0, 5)}
      </p>
      <p className="flex-1 px-3">{history.avg_production_time}초</p>
      <p className="flex-1 px-3">
        {history.end_date.split('T')[0]}{' '}
        {history.end_date.split('T')[1]?.split('.')[0]?.slice(0, 5)}
      </p>
    </div>
  );
};

export default FacilityHistoryItem;
