import { MaterialHistoryResponseModel } from '@/types/data-model';
import { ArrowLineUpRight } from '@phosphor-icons/react';

interface QuotationHistoryItemProps {
  onClick: () => void;
  data: MaterialHistoryResponseModel;
}

const QuotationHistoryItem = ({ onClick, data }: QuotationHistoryItemProps) => {
  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-pointer hover:border hover:border-primary transition-colors duration-200 group">
      <div
        className="flex-1 px-3 flex items-center gap-1 min-w-0"
        title={data.client_name}
      >
        <p className="text-dg truncate">{data.client_name}</p>
        <button
          className="w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-bg transition-colors duration-200 group-hover:opacity-100 opacity-0"
          onClick={onClick}
        >
          <ArrowLineUpRight size={16} className="text-dg" />
        </button>
      </div>

      <p className="flex-1 px-3 text-dg">{data.date?.split('T')[0]}</p>
      <p
        className="flex-[0.5] px-3 text-dg truncate min-w-0"
        title={data.quantity.toLocaleString()}
      >
        {data.quantity.toLocaleString()}
      </p>
      <p
        className="flex-[0.5] px-3 text-dg truncate min-w-0"
        title={data.unit_price.toLocaleString()}
      >
        {data.unit_price.toLocaleString()}
      </p>
      <p
        className="flex-[0.5] px-3 text-dg truncate min-w-0"
        title={data.amount.toLocaleString()}
      >
        {data.amount.toLocaleString()}
      </p>
    </div>
  );
};

export default QuotationHistoryItem;
